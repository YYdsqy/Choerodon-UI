---
title: API
---

### Transfer

> 1.5.0 版本及以上新增属性。

| 参数      | 说明                                     | 类型        |默认值 |
|-----------|------------------------------------------|------------|--------|
| operations | 操作文案集合，顺序从下至上 | string\[] \| ReactNode[] | ['>', '<'] |
| sortable | 是否显示排序按钮 | boolean | false |
| sortOperations | 排序文案集合 | string\[] \| ReactNode[] | ['∧', '∨'] |
| oneWay(1.5.1) | 是否单向穿梭 | boolean | false |

更多属性请参考 [Select](/zh/procmp/data-entry/select/#Select)。


### Transfer.OptGroup 

| 参数      | 说明                                     | 类型        |
|-----------|------------------------------------------|------------|
| label | 选项组标题 | string |

### Transfer.Option

| 参数      | 说明                                     | 类型        |
|-----------|------------------------------------------|------------|
| value | 选项值 | any |

### Render Props

> 1.5.3 版本新增组件。

- Transfer 支持接收 children 自定义渲染列表，并返回以下参数：

| 参数      | 说明                                     | 类型        |
|-----------|------------------------------------------|------------|
| direction | 渲染列表的方向 | `left` \| `right`  |
| targetOption | 目标数据源 | Record[]  |
| onItemSelect | 勾选条目 | (Records: Record[])  |

#### 参考示例

```
<Transfer {...props}>{({ direction, targetOption, onItemSelect}) => <YourComponent {...listProps} />}</Transfer>
 ```