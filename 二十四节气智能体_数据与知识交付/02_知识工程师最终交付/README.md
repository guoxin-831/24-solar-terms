# 二十四节气知识关系数据

## 文件清单

| 文件 | 内容 |
| --- | --- |
| `data/solar_terms.json` | 24 个节气的基础资料，供详情页和内容生成读取 |
| `data/solar_terms.csv` | 基础资料的 CSV 版本 |
| `data/二十四节气表_送审版.xlsx` | 基础资料的表格版 |
| `kg/relations.json` | 节气与物候、习俗、食物、诗词的节点和关系 |
| `docs/字段说明.md` | 两份 JSON 的字段定义 |
| `docs/数据校验报告.md` | 基础资料的覆盖与格式结果 |
| `docs/关系校验报告.md` | 关系数据的数量与覆盖结果 |

## 关系数据结构

`kg/relations.json` 包含 `nodes` 和 `relations`。节气节点 ID 为 `ST01`—`ST24`；其余节点按类型和名称区分。

| 关系类型 | 含义 | 示例 |
| --- | --- | --- |
| `has_phenology` | 节气关联物候 | 立春 → 东风解冻 |
| `has_custom` | 节气关联习俗 | 立春 → 迎春 |
| `has_food` | 节气关联食物 | 冬至 → 饺子 |
| `has_poem` | 节气关联诗词引用 | 立春 → 张栻《立春偶成》 |

关系中的 `source_record`、`source_field`、`source_value` 对应基础资料中的节气、字段和原文；`source_url` 是该节气的资料页。`display_text` 保留复合字段的完整写法。物候关系的 `order` 表示一候、二候、三候。

## 读取示例

```js
const [terms, kg] = await Promise.all([
  fetch('data/solar_terms.json').then(r => r.json()),
  fetch('kg/relations.json').then(r => r.json())
]);

const term = terms.find(t => t.name === '立春');
const termNode = kg.nodes.find(n => n.type === 'solar_term' && n.name === term.name);
const nodeById = new Map(kg.nodes.map(n => [n.id, n]));
const related = kg.relations
  .filter(r => r.from === termNode.id)
  .map(r => ({ ...r, target: nodeById.get(r.to) }));
```

详情页从 `terms` 读取交节规则、气候和地域；关系浏览从 `related` 读取实体和关系；内容生成同时读取该节气的基础资料与关系。资料范围之外的问答统一返回“资料未覆盖”。
