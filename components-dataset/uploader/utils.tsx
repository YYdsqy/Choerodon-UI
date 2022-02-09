import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { action as mobxAction, runInAction } from 'mobx';
import { DataSetContext } from '../data-set/DataSet';
import AttachmentFile from '../data-set/AttachmentFile';
import AttachmentFileChunk from '../data-set/AttachmentFileChunk';
import { appendFormData } from '../data-set/utils';
import axios from '../axios';
import PromiseQueue from '../promise-queue';
import { UploaderProps } from './Uploader';

function getAxios(context: DataSetContext): AxiosInstance {
  return context.getConfig('axios') || axios;
}

export function isAcceptFile(attachment: AttachmentFile, accept: string[]): boolean {
  const acceptTypes = accept.map(type => (
    new RegExp(type.replace(/\./g, '\\.').replace(/\*/g, '.*'))
  ));
  const { name, type } = attachment;
  return acceptTypes.some(acceptType => acceptType.test(name) || acceptType.test(type));
}

function getUploadAxiosConfig(
  props: UploaderProps,
  attachment: AttachmentFile,
  chunk: AttachmentFileChunk | undefined,
  attachmentUUID: string,
  context: DataSetContext,
  onUploadProgress: (e) => void,
): AxiosRequestConfig {
  const { originFileObj } = attachment;
  if (originFileObj) {
    const blob = chunk ? originFileObj.slice(chunk.start, chunk.end) : originFileObj;
    const globalConfig = context.getConfig('attachment');
    const { action, data, headers, fileKey = globalConfig.defaultFileKey, withCredentials } = props;
    const newHeaders = {
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    };
    const formData = new FormData();
    formData.append(fileKey, blob);
    if (data) {
      appendFormData(formData, data);
    }
    if (action && !chunk) {
      return {
        url: action,
        headers: newHeaders,
        data: formData,
        onUploadProgress,
        method: 'POST',
        withCredentials,
      };
    }
    const actionHook = globalConfig.action;
    if (actionHook) {
      const { bucketName, bucketDirectory, storageCode, isPublic } = props;
      const newConfig = typeof actionHook === 'function' ? actionHook({
        attachment,
        chunk,
        bucketName,
        bucketDirectory,
        storageCode,
        attachmentUUID,
        isPublic,
      }) : actionHook;
      const { data: customData, onUploadProgress: customUploadProgress } = newConfig;
      if (customData) {
        appendFormData(formData, customData);
      }
      return {
        withCredentials,
        method: 'POST',
        ...newConfig,
        headers: {
          ...newHeaders,
          ...newConfig.headers,
        },
        data: formData,
        onUploadProgress: (e) => {
          onUploadProgress(e);
          if (customUploadProgress) {
            customUploadProgress(e);
          }
        },
      };
    }
    throw new Error(`Please set configure.attachment.action .`);
  }
  throw new Error('AttachmentFile can be uploaded only from input.files or DragEvent.dataTransfer.files');
}

async function uploadChunk(props: UploaderProps, attachment: AttachmentFile, chunk: AttachmentFileChunk, attachmentUUID: string, context: DataSetContext): Promise<any> {
  const { onBeforeUploadChunk } = context.getConfig('attachment');
  if (!onBeforeUploadChunk || await onBeforeUploadChunk(chunk, attachment) !== false) {
    const config = getUploadAxiosConfig(props, attachment, chunk, attachmentUUID, context, mobxAction((e) => {
      chunk.percent = e.total > 0 ? (e.loaded / e.total) * 100 : 0;
    }));
    const resp = await getAxios(context)(config);
    chunk.status = 'success';
    return resp;
  }
}

function uploadChunks(
  props: UploaderProps,
  attachment: AttachmentFile,
  chunks: AttachmentFileChunk[],
  attachmentUUID: string,
  context: DataSetContext,
  threads: number,
): Promise<void> {
  const { length } = chunks;
  if (length) {
    runInAction(() => {
      attachment.status = 'uploading';
    });
    const queue = new PromiseQueue(threads);
    chunks.forEach(chunk => {
      if (chunk.status !== 'success') {
        queue.add(() => uploadChunk(props, attachment, chunk, attachmentUUID, context));
      }
    });
    return queue.ready();
  }
  return Promise.resolve();
}

async function uploadNormalFile(props: UploaderProps, attachment: AttachmentFile, attachmentUUID: string, context: DataSetContext) {
  const config = getUploadAxiosConfig(props, attachment, undefined, attachmentUUID, context, mobxAction((e) => {
    const percent = e.total > 0 ? (e.loaded / e.total) * 100 : 0;
    attachment.status = 'uploading';
    attachment.percent = percent;
    const { onUploadProgress: handleProgress } = props;
    if (handleProgress) {
      handleProgress(percent, attachment);
    }
  }));
  const resp = await getAxios(context)(config);
  attachment.percent = 100;
  return new Promise<any>((resolve) => {
    setTimeout(() => resolve(resp), 0);
  });
}

export async function uploadFile(props: UploaderProps, attachment: AttachmentFile, attachmentUUID: string, context: DataSetContext): Promise<any> {
  const { useChunk } = props;
  if (useChunk) {
    const globalConfig = context.getConfig('attachment');
    const { chunkSize = globalConfig.defaultChunkSize } = props;
    if (chunkSize > 0) {
      const chunks = cuteFile(attachment, chunkSize);
      const { length } = chunks;
      if (length > 1) {
        const { chunkThreads = globalConfig.defaultChunkThreads } = props;
        return uploadChunks(props, attachment, chunks.slice(), attachmentUUID, context, Math.min(length, chunkThreads));
      }
      delete attachment.chunks;
    }
  }
  return uploadNormalFile(props, attachment, attachmentUUID, context);
}

function cuteFile(attachment: AttachmentFile, chunkSize: number): AttachmentFileChunk[] {
  const { size, chunks } = attachment;
  if (!chunks) {
    const count = chunkSize ? Math.ceil(size / chunkSize) : 1;
    let start = 0;
    let index = 0;
    let len;
    const newChunks: AttachmentFileChunk[] = [];
    while (index < count) {
      len = Math.min(chunkSize, size - start);
      newChunks.push(new AttachmentFileChunk({
        file: attachment,
        total: size,
        start,
        end: chunkSize ? (start + len) : size,
        index,
      }));
      index += 1;
      start += len;
    }
    if (newChunks.length > 1) {
      attachment.chunks = newChunks;
    }
    return newChunks;
  }
  return chunks;
}