# 前端对接说明（对接文档 v0.1）

> 作者：前端工程师
> 依据：《二十四节气智能体小组项目计划书》模块对接约定
> 状态：字段契约待数据工程师、知识工程师、AI 工程师确认；确认后冻结

## 一、前端读哪些文件

前端**不写死任何节气内容**，只读取以下三个真实数据文件：

| 文件路径（相对仓库根） | 产出人 | 内容 | 前端对应功能 |
|---|---|---|---|
| `data/solar_terms.json` | 数据工程师 | 24 节气表 | 功能一：总览 / 功能二：详情 |
| `kg/relations.json` | 知识工程师 | 关系数据 | 功能三：关系浏览 |
| `ai/results.json` | AI 工程师 | 生成结果 | 功能二：介绍卡 / 功能四：问答 |

页面通过本地静态服务器运行（如 `python -m http.server`），浏览器直接双击打开 `file://` 会被 CORS 拦截，无法 fetch。

## 二、字段契约

字段名统一英文，中文只出现在字段值里（计划书统一约定）。

### 2.1 data/solar_terms.json —— 数组，24 个对象，顺序按节气先后

```json
[
  {
    "id": "lichun",
    "name": "立春",
    "season": "spring",
    "date_rule": "每年公历2月3日至5日交节",
    "climate": "……",
    "phenology": ["东风解冻", "蛰虫始振", "鱼陟负冰"],
    "customs": ["咬春", "打春牛"],
    "foods": ["春饼", "春卷"],
    "poems": [
      { "title": "《京中正月七日立春》", "author": "罗隐", "content": "一二三四五六七，万木生芽是今日。" }
    ],
    "regions": ["全国"],
    "provinces": [
      { "province": "北京", "phenology": "……", "farming": "……", "custom": "……" }
    ],
    "sources": ["《月令七十二候集解》"]
  }
]
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 节气唯一标识，全小写拼音（如 `lichun`、`yushui`），**全组以此为唯一键**，关系数据和 AI 结果都靠它关联 |
| `name` | string | 是 | 节气中文名 |
| `season` | string | 是 | 四季归属：`spring` / `summer` / `autumn` / `winter`。**前端总览按四季分组进入，必须有此字段**；若数据表未列，请数据工程师按传统四季划分补上 |
| `date_rule` | string | 是 | 交节规则（公历日期范围） |
| `climate` | string | 是 | 气候描述 |
| `phenology` | string[] | 是 | 物候（三候），至少 1 条 |
| `customs` | string[] | 是 | 习俗，不能为空（计划书完成标准） |
| `foods` | string[] | 否 | 食俗，可为空数组 |
| `poems` | object[] | 否 | 诗词，可为空数组；每条含 `title` / `author` / `content` |
| `regions` | string[] | 是 | 关联地域 |
| `provinces` | object[] | 否 | 分省数据，可为空数组；每条含 `province` / `phenology` / `farming` / `custom`，用于详情页「各地物候」区块 |
| `sources` | string[] | 是 | 资料来源，**不能为空**（计划书完成标准） |

### 2.2 kg/relations.json —— 对象，含 nodes 和 edges

```json
{
  "nodes": [
    { "id": "term-lichun", "type": "term", "label": "立春" },
    { "id": "ph-dongfeng-jiedong", "type": "phenology", "label": "东风解冻" },
    { "id": "cu-yaochun", "type": "custom", "label": "咬春" },
    { "id": "food-chunbing", "type": "food", "label": "春饼" },
    { "id": "poem-jingzhong", "type": "poetry", "label": "《京中正月七日立春》" }
  ],
  "edges": [
    { "from": "term-lichun", "rel": "phenology", "to": "ph-dongfeng-jiedong", "source": "《月令七十二候集解》" }
  ]
}
```

| 项 | 约定 | 说明 |
|---|---|---|
| `nodes[].type` | `term` / `phenology` / `custom` / `food` / `poetry` | 五种实体（计划书知识工程师一节） |
| `nodes[].id` | `type前缀-拼音`，如 `term-lichun` | 全局唯一；节气节点 id 必须是 `term-` + 节气表里的 `id` |
| `edges[].rel` | `phenology` / `custom` / `food` / `poetry` | 关系类型，四种 |
| `edges[].source` | string | 来源，没有来源的关系不写（计划书底线） |

前端依赖：功能三按 `edges` 里 `from` 为某节气节点筛选，展开它连的所有 `phenology` / `custom` / `food` / `poetry` 节点。

### 2.3 ai/results.json —— 数组，24 个对象，与节气表一一对应

```json
[
  {
    "term_id": "lichun",
    "intro": "立春是二十四节气之首……",
    "broadcast": "大家好，今天我们来说立春……",
    "qa": [
      {
        "question": "立春有什么习俗？",
        "answer": "立春有咬春、打春牛的习俗……",
        "evidence": [
          { "ref": "solar_terms.json#lichun.customs[0]", "source": "《月令七十二候集解》" }
        ]
      }
    ]
  }
]
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `term_id` | 是 | 对应节气表 `id`，前端靠它把介绍挂到对应节气 |
| `intro` | 是 | 介绍正文（介绍卡片用） |
| `broadcast` | 是 | 口播稿（第 8 周卡片/口播双视图用） |
| `qa[].question` / `answer` | 是 | 问答对 |
| `qa[].evidence` | 是 | 依据列表，指回节气表或关系里的具体记录；**资料未覆盖的条目，`answer` 直接写「资料未覆盖」，`evidence` 为空数组**（计划书硬约束，前端如实展示，不做美化） |

## 三、前端依赖谁、什么时候要

| 前端功能 | 依赖文件 | 计划书节点 | 最晚需要时间 |
|---|---|---|---|
| 功能一 总览 | `data/solar_terms.json` | 第 6 周总览读真数据 | 第 6 周前 |
| 功能二 详情 | 同上 + `ai/results.json` | 第 6 周 | 第 6 周前 |
| 功能三 关系浏览 | `kg/relations.json` | 第 7 周 | 第 7 周前 |
| 功能四 问答 | `ai/results.json` | 第 7 周 | 第 7 周前 |

## 四、前端怎么跑

```powershell
cd d:\融媒体技术及实践
python -m http.server 8000
# 浏览器打开 http://localhost:8000/web/
```

## 五、待确认清单

- [ ] 数据工程师：`season` 字段是否在节气表里？不在请补（总览必需）
- [ ] 数据工程师：节气表最终用 JSON 还是 CSV？（前端按 JSON 写，CSV 需前端加转换）
- [ ] 知识工程师：节点 id 命名规则（`type前缀-拼音`）是否接受？
- [ ] AI 工程师：`results.json` 的 `evidence.ref` 指回格式是否可按上面示例产出？
