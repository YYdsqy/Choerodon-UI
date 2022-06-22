import React from 'react';
import ReactDOM from 'react-dom';
import { DataSet, Table, Transfer } from 'choerodon-ui/pro';

const { Column } = Table;

class App extends React.Component {
  sourceDs;

  targetDs;

  dsCommon = (onItemSelect, events = {}) => ({
    primaryKey: 'userid',
    autoQuery: true,
    paging: false,
    fields: [
      {
        name: 'userid',
        type: 'string',
        label: '编号',
      },
      {
        name: 'name',
        type: 'intl',
        label: '姓名',
        required: true,
      },
    ],
    events: {
      batchSelect: ({ dataSet }) => {
        onItemSelect(dataSet.selected);
      },
      batchUnSelect: ({ dataSet }) => {
        onItemSelect(dataSet.selected);
      },
      ...events,
    },
  });

  render() {
    return (
      <Transfer style={{ height: 300, width: 500 }}>
        {({ direction, targetOption, setTargetOption, onItemSelect }) => {
          if (direction === 'right') {
            if (!this.targetDs) {
              const events = {
                load: ({ dataSet }) => {
                  setTargetOption(dataSet.records);
                },
              };
              this.targetDs = new DataSet({
                data: [
                  { userid: '5', name: '赵六' },
                  { userid: '6', name: '田七' },
                ],
                ...this.dsCommon(onItemSelect, events),
              });
            }
            // 当左边的数据转移到右边的时候，此时 targetOption 就会有数据
            // 这里的逻辑是模拟的数据穿梭，真实情况的数据请考虑 ds 结合接口查询
            if (
              this.targetDs.status === 'ready' &&
              targetOption.length !== this.targetDs.length
            ) {
              if (targetOption.length < this.targetDs.length) {
                // 向左 转移
                const cacheRecords = [];
                // eslint-disable-next-line no-restricted-syntax
                for (const record of this.targetDs.records) {
                  const findRecord = targetOption.find(
                    (x) => x.get('userid') === record.get('userid'),
                  );
                  if (!findRecord) {
                    cacheRecords.push(record);
                  }
                }
                this.sourceDs.appendData([...cacheRecords]);
                this.targetDs.remove(cacheRecords, true);
              } else {
                // 向右 转移
                this.targetDs.appendData(
                  this.sourceDs.selected.map((x) => x.toData()),
                );
                this.sourceDs.remove(this.sourceDs.selected, true);
              }
            }
          } else if (direction === 'left') {
            if (!this.sourceDs) {
              this.sourceDs = new DataSet({
                data: [
                  { userid: '1', name: '彭霞' },
                  { userid: '2', name: '孔秀兰' },
                  { userid: '3', name: '孟艳' },
                  { userid: '4', name: '邱芳' },
                ],
                ...this.dsCommon(onItemSelect),
              });
            }
          }

          return (
            <Table
              name="table"
              key="user"
              dataSet={direction === 'left' ? this.sourceDs : this.targetDs}
            >
              <Column name="userid" />
              <Column name="name" />
            </Table>
          );
        }}
      </Transfer>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
