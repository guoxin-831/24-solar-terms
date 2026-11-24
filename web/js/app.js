/* ============================================
   app.js — 全屏滚动翻页（苹果风格）
   板块：封面 → 春 → 夏 → 秋 → 冬 → 探索 → 数据
   数据全部来自最终交付的节气表与知识关系
   ============================================ */

let store = {
  terms: null, kg: null, aiResults: null, aiMissing: false,
  problems: [], counts: { terms: 0, relations: 0, nodes: 0 }
};

const SEASONS = [
  { key: 'spring', cn: '春', en: 'SPRING' },
  { key: 'summer', cn: '夏', en: 'SUMMER' },
  { key: 'autumn', cn: '秋', en: 'AUTUMN' },
  { key: 'winter', cn: '冬', en: 'WINTER' }
];

const REL_GROUPS = [
  { key: 'phenology', label: '物候' },
  { key: 'custom',    label: '习俗' },
  { key: 'food',      label: '食俗' },
  { key: 'poem',      label: '诗词' }
];

const HOU_LABELS = ['一候', '二候', '三候'];

/* 版图取点：先从交付资料的 region 字段里找具体地点，找不到再退到省域中心 */
const MAP_CITIES = [
  ['衢州', '浙江衢州', 118.87, 28.94], ['石阡', '贵州石阡', 108.23, 27.51],
  ['铜川', '陕西铜川', 109.07, 34.90], ['内乡', '河南内乡', 111.85, 33.05],
  ['宁波', '浙江宁波', 121.55, 29.87], ['荣成', '山东荣成', 122.42, 37.16],
  ['海宁', '浙江海宁', 120.68, 30.51], ['绍兴', '浙江绍兴', 120.58, 30.00],
  ['临沂', '山东临沂', 118.35, 35.05], ['台州', '浙江台州', 121.42, 28.66],
  ['杭州', '浙江杭州', 120.15, 30.27], ['象山', '浙江象山', 121.87, 29.48],
  ['舟山', '浙江舟山', 122.20, 30.00], ['太湖', '江苏太湖', 120.20, 31.20],
  ['资兴', '湖南资兴', 113.24, 25.98], ['高明', '广东高明', 112.90, 22.90],
  ['烟台', '山东烟台', 121.40, 37.50], ['三门', '浙江三门', 121.40, 29.10],
  ['潮汕', '广东潮汕', 116.60, 23.60], ['姑苏', '江苏苏州', 120.60, 31.30],
  ['嘉兴', '浙江嘉兴', 120.75, 30.75], ['佛山', '广东佛山', 113.12, 23.02],
  ['安庆', '安徽安庆', 117.05, 30.53], ['无锡', '江苏无锡', 120.30, 31.57],
  ['莆田', '福建莆田', 119.01, 25.45], ['南京', '江苏南京', 118.80, 32.06],
  ['苏州', '江苏苏州', 120.58, 31.30], ['常熟', '江苏常熟', 120.75, 31.65],
  ['北京', '北京', 116.43, 39.92], ['天津', '天津', 117.20, 39.13],
  ['上海', '上海', 121.47, 31.23], ['哈尔滨', '黑龙江哈尔滨', 126.53, 45.80],
  ['武汉', '湖北武汉', 114.30, 30.60], ['广州', '广东广州', 113.26, 23.13],
  ['漠河', '黑龙江漠河', 122.50, 53.40], ['台湾', '台湾', 120.90, 23.60]
];

/* 地区泛称（川西、皖南…）优先度低于具体城市，避免与气候描述错位 */
const MAP_REGIONS = [
  ['川西', '川西', 102.60, 31.00], ['皖南', '皖南', 118.30, 30.00],
  ['闽南', '闽南', 117.60, 24.90], ['苏南', '苏南', 120.30, 31.60],
  ['鲁南', '鲁南', 118.10, 35.10], ['粤东南', '粤东南', 115.80, 23.40],
  ['湘中湘北', '湘中湘北', 112.30, 28.20], ['黄河流域', '黄河流域', 113.60, 34.80]
];

const MAP_PROVINCES = [
  ['浙江', 120.20, 29.20], ['江苏', 119.50, 33.00], ['安徽', 117.30, 31.80],
  ['山东', 118.00, 36.30], ['河南', 113.60, 34.00], ['河北', 114.50, 38.00],
  ['山西', 112.30, 37.60], ['陕西', 108.90, 34.30], ['甘肃', 103.80, 36.00],
  ['湖北', 112.30, 30.90], ['湖南', 111.70, 27.60], ['江西', 115.90, 27.60],
  ['福建', 118.30, 26.10], ['广东', 113.40, 23.40], ['广西', 108.30, 23.80],
  ['四川', 102.70, 30.60], ['贵州', 106.70, 26.80], ['云南', 101.50, 25.00],
  ['黑龙江', 128.00, 47.50], ['吉林', 125.30, 43.90], ['辽宁', 123.40, 41.80],
  ['内蒙古', 111.70, 40.80], ['新疆', 85.60, 42.00], ['西藏', 88.40, 31.10],
  ['青海', 96.00, 35.60], ['宁夏', 106.20, 37.30], ['海南', 109.80, 19.20],
  ['重庆', 107.90, 29.60], ['香港', 114.20, 22.30], ['澳门', 113.50, 22.20]
];

const MAP_SEASON_COLOR = {
  spring: '#6f8b57', summer: '#3e7c99', autumn: '#b06e39', winter: '#5b6b7f'
};

/* 四季地理特征：分带着色 + 关键气候界线 + 季节现场。
   依据中国气候常识整理：一月零度等温线沿秦岭—淮河、夏季雨带自南向北推进、
   华西秋雨、初霜冻自北向南、青藏高原夏季凉爽等。 */
/* 景色符号：决定季节景观点在 3D 地图上的形状与颜色 */
const MAP_SCENE_STYLE = {
  bloom:    { label: '花开新绿', color: '#d98a9c', symbol: 'circle',   size: 10 },
  rain:     { label: '烟雨雨带', color: '#3e7c99', symbol: 'triangle', size: 11 },
  drought:  { label: '春旱风沙', color: '#b98d55', symbol: 'circle',   size: 10 },
  thaw:     { label: '残雪消融', color: '#9fc0d6', symbol: 'diamond',  size: 10 },
  heat:     { label: '烈日暑热', color: '#c1442e', symbol: 'pin',      size: 16 },
  storm:    { label: '台风风暴', color: '#2f6f7e', symbol: 'arrow',    size: 14 },
  cool:     { label: '高原清凉', color: '#6fa5b8', symbol: 'diamond',  size: 10 },
  gold:     { label: '金秋红叶', color: '#d08a2e', symbol: 'diamond',  size: 11 },
  frost:    { label: '初霜降临', color: '#a9c4d8', symbol: 'triangle', size: 10 },
  snow:     { label: '冰雪封冻', color: '#e8f0f7', symbol: 'diamond',  size: 12 },
  freeze:   { label: '零度分界', color: '#7d97ad', symbol: 'circle',   size: 10 },
  mild:     { label: '暖冬花开', color: '#e0b84f', symbol: 'circle',   size: 10 },
  coldwave: { label: '寒潮南下', color: '#5b6b7f', symbol: 'arrow',    size: 14 }
};

const MAP_SEASONS = {
  spring: {
    cn: '春', en: 'SPRING', range: '三月—五月', fx: 'petal',
    light: { main: { color: '#fff3df', intensity: 1.0 }, ambient: { intensity: .68 } },
    climate: '太阳直射点北返，全国自南向北回暖。华南二月已入春，江南三月草长莺飞，华北四月风沙渐止，东北要等到五月才真正解冻。南方春雨连绵，北方降水仍少、易发春旱。',
    phenology: '桃始华、仓庚鸣、玄鸟至。江南茶芽初展，华北柳色新黄，东北残雪未消。',
    bands: [
      { label: '华南春早 · 繁花', color: '#7fa05c', height: 4.2, provinces: ['海南', '广东', '广西', '台湾', '香港', '澳门', '福建', '云南'] },
      { label: '江南春雨 · 新绿', color: '#9db67c', height: 3.6, provinces: ['浙江', '江西', '湖南', '湖北', '安徽', '江苏', '上海', '贵州', '重庆', '四川'] },
      { label: '华北回暖 · 柳黄', color: '#c6b886', height: 2.6, provinces: ['北京', '天津', '河北', '山东', '河南', '山西', '陕西', '宁夏', '甘肃'] },
      { label: '东北西北 · 残雪', color: '#9db2c2', height: 1.7, provinces: ['黑龙江', '吉林', '辽宁', '内蒙古', '新疆', '青海', '西藏'] }
    ],
    lines: [
      { label: '华南前汛期雨带', color: '#3e7c99', coords: [[110.3, 25.3], [113.6, 24.8], [114.9, 25.8], [117.0, 25.1], [118.1, 24.5]] }
    ],
    marks: [
      { name: '江南春雨', place: '浙江杭州', lng: 120.15, lat: 30.27, scene: 'rain', desc: '三月至五月阴雨连绵，空气湿润，茶树抽芽，正是明前茶的时节。' },
      { name: '回南天', place: '广东广州', lng: 113.26, lat: 23.13, scene: 'rain', desc: '华南二三月回暖，冷空气退去后墙壁地面返潮出水，人称回南天。' },
      { name: '婺源花海', place: '江西婺源', lng: 117.86, lat: 29.25, scene: 'bloom', desc: '三月中下旬万亩油菜花开，白墙黛瓦间一片金黄，是江南春日标志。' },
      { name: '林芝桃花', place: '西藏林芝', lng: 94.36, lat: 29.65, scene: 'bloom', desc: '三月底至四月，高原河谷野桃盛开，雪山衬桃花，人称藏地江南。' },
      { name: '华北春旱', place: '北京', lng: 116.43, lat: 39.92, scene: 'drought', desc: '升温快、降水少，有十年九春旱之说，多风沙天气。' },
      { name: '东北迟春', place: '黑龙江哈尔滨', lng: 126.53, lat: 45.80, scene: 'thaw', desc: '四月仍见残雪，江河解冻流凌，五月丁香才开，春天比江南晚两个月。' }
    ]
  },
  summer: {
    cn: '夏', en: 'SUMMER', range: '六月—八月', fx: 'rain',
    light: { main: { color: '#fff0cf', intensity: 1.22 }, ambient: { intensity: .55 } },
    climate: '除青藏高原外全国普遍高温，南北温差小。副热带高压北推，雨带自华南经江淮移至华北、东北，雨热同季。长江中下游出梅后进入伏旱，东南沿海台风频繁。',
    phenology: '蝉鸣蛙噪，荷开稻长。江南梅熟，华北麦收，岭南荔枝红透。',
    bands: [
      { label: '火炉湿热 · 浓荫', color: '#b85a3c', height: 4.4, provinces: ['重庆', '湖北', '湖南', '江西', '安徽', '江苏', '浙江', '上海', '福建', '广东', '广西', '海南', '台湾', '香港', '澳门', '四川'] },
      { label: '雨季北国 · 麦浪', color: '#cc8449', height: 3.4, provinces: ['北京', '天津', '河北', '山东', '河南', '山西', '陕西', '辽宁', '吉林', '黑龙江', '内蒙古'] },
      { label: '西北干热 · 戈壁', color: '#d6ad68', height: 2.2, provinces: ['新疆', '甘肃', '宁夏'] },
      { label: '高原清凉 · 草甸', color: '#74a2b3', height: 2.4, provinces: ['西藏', '青海', '云南', '贵州'] }
    ],
    lines: [
      { label: '江淮梅雨带', color: '#3e7c99', coords: [[106.5, 29.6], [111.3, 30.7], [114.3, 30.6], [116.0, 29.7], [118.8, 32.1], [121.5, 31.2]] }
    ],
    marks: [
      { name: '江淮梅雨', place: '江苏南京', lng: 118.80, lat: 32.06, scene: 'rain', desc: '六月中下旬入梅，阴雨近一月，湿度大、衣物易霉，出梅后转为伏旱。' },
      { name: '火洲吐鲁番', place: '新疆吐鲁番', lng: 89.19, lat: 42.95, scene: 'heat', desc: '七月均温三十三度，极端最高四十九度，盆地聚热，是中国最热的地方。' },
      { name: '高原清凉', place: '西藏拉萨', lng: 91.11, lat: 29.65, scene: 'cool', desc: '海拔高、空气稀薄，七月均温仅十余度，昼暖夜凉，无盛夏之感。' },
      { name: '台风登陆', place: '福建福州', lng: 119.30, lat: 26.08, scene: 'storm', desc: '七月至九月台风频繁登陆东南沿海，带来狂风暴雨，也解伏旱之渴。' },
      { name: '华北雨季', place: '北京', lng: 116.43, lat: 39.92, scene: 'rain', desc: '七月下旬至八月上旬进入主汛期，全年降水近半集中在这一个月。' },
      { name: '呼伦贝尔草原', place: '内蒙古呼伦贝尔', lng: 119.77, lat: 49.22, scene: 'cool', desc: '盛夏草原碧绿铺展，均温不足二十度，是北国最凉爽的天然牧场。' }
    ]
  },
  autumn: {
    cn: '秋', en: 'AUTUMN', range: '九月—十一月', fx: 'leaf',
    light: { main: { color: '#ffd9a4', intensity: 1.05 }, ambient: { intensity: .62 } },
    climate: '冷空气自北向南推进，雨带南撤。华北秋高气爽、昼夜温差大；四川盆地与关中一带阴雨绵绵，称华西秋雨；江南秋老虎余热未消，华南仍热。初霜冻自北向南出现。',
    phenology: '鸿雁南飞，草木黄落。华北柿红梨熟，江南桂子飘香，东北层林尽染。',
    bands: [
      { label: '秋高气爽 · 红叶', color: '#c4913f', height: 4.0, provinces: ['北京', '天津', '河北', '山东', '山西', '陕西', '河南', '辽宁', '吉林', '黑龙江', '内蒙古', '宁夏', '甘肃', '新疆'] },
      { label: '华西秋雨 · 烟岚', color: '#948a63', height: 3.0, provinces: ['四川', '重庆', '贵州', '云南'] },
      { label: '江南迟秋 · 桂香', color: '#b6843c', height: 3.2, provinces: ['江苏', '浙江', '安徽', '江西', '湖南', '湖北', '上海'] },
      { label: '华南余暑 · 常绿', color: '#bd6740', height: 2.8, provinces: ['广东', '广西', '海南', '台湾', '香港', '澳门', '福建'] }
    ],
    lines: [
      { label: '华西秋雨带', color: '#3e7c99', coords: [[104.1, 30.7], [105.8, 32.4], [107.0, 33.1], [108.9, 34.3]] },
      { label: '初霜冻线', color: '#5b6b7f', coords: [[123.4, 41.8], [116.4, 39.9], [114.5, 38.0], [112.5, 37.9], [106.3, 38.5], [98.5, 39.7]] }
    ],
    marks: [
      { name: '喀纳斯秋色', place: '新疆喀纳斯', lng: 87.02, lat: 48.70, scene: 'gold', desc: '九月白桦与泰加林层林尽染，湖水碧蓝，是中国最早的秋天。' },
      { name: '九寨沟彩林', place: '四川九寨沟', lng: 103.92, lat: 33.26, scene: 'gold', desc: '十月霜后山林转为红金黄绿，叠瀑彩林相映，华西秋色极致。' },
      { name: '华西秋雨', place: '四川成都', lng: 104.07, lat: 30.67, scene: 'rain', desc: '九十月阴雨绵绵，雨日多而强度小，连日不开，是西南秋季的常态。' },
      { name: '秋高气爽', place: '北京', lng: 116.43, lat: 39.92, scene: 'gold', desc: '九月天高云淡，香山红叶渐次转红，能见度全年最好。' },
      { name: '初霜', place: '新疆乌鲁木齐', lng: 87.62, lat: 43.82, scene: 'frost', desc: '九月下旬即见初霜，比华北早约一个月，北疆牧场转入越冬。' },
      { name: '寒露风', place: '湖南长沙', lng: 112.94, lat: 28.23, scene: 'rain', desc: '秋季冷空气南下，晚稻抽穗扬花遇低温，造成空壳减产，称寒露风。' },
      { name: '秋老虎', place: '广东广州', lng: 113.26, lat: 23.13, scene: 'heat', desc: '九月副热带高压南撤前再度北抬，华南晴热如夏，俗称秋老虎。' }
    ]
  },
  winter: {
    cn: '冬', en: 'WINTER', range: '十二月—二月', fx: 'snow',
    light: { main: { color: '#dce8f6', intensity: .88 }, ambient: { intensity: .74 } },
    climate: '冬季风自西伯利亚、蒙古南下，南北温差全年最大。一月零度等温线大致沿秦岭—淮河并西延至青藏高原东南边缘，线北河流封冻、线南不冻。漠河一月均温约零下三十度，海南仍有二十度上下。',
    phenology: '水始冰，地始冻。北方朔风积雪，江南寒梅初绽，岭南花市如春。',
    bands: [
      { label: '严寒 · 雪原林海', color: '#56677c', height: 1.8, provinces: ['黑龙江', '吉林', '内蒙古', '新疆'] },
      { label: '寒冷 · 冻土麦田', color: '#78889c', height: 2.4, provinces: ['辽宁', '北京', '天津', '河北', '山西', '山东', '河南', '陕西', '宁夏', '甘肃', '青海', '西藏'] },
      { label: '温冷 · 寒梅烟雨', color: '#9fadb9', height: 2.9, provinces: ['江苏', '安徽', '湖北', '四川', '重庆', '贵州', '湖南', '江西', '浙江', '上海'] },
      { label: '温暖 · 常绿花开', color: '#c8b48c', height: 3.6, provinces: ['广东', '广西', '海南', '福建', '台湾', '香港', '澳门', '云南'] }
    ],
    lines: [
      { label: '秦岭—淮河零度线', color: '#a9432f', coords: [[94.5, 29.6], [101.0, 28.0], [104.5, 30.5], [108.9, 33.6], [113.6, 33.0], [117.2, 32.7], [120.0, 33.3]] },
      { label: '寒潮南下路径', color: '#5b6b7f', coords: [[110.0, 49.0], [111.7, 42.0], [114.5, 38.0], [116.4, 35.0], [113.3, 30.6], [113.3, 23.1]] }
    ],
    marks: [
      { name: '漠河极寒', place: '黑龙江漠河', lng: 122.50, lat: 53.40, scene: 'snow', desc: '一月均温零下三十度，极端最低零下五十二度，是我国最冷的地方。' },
      { name: '哈尔滨冰雪', place: '黑龙江哈尔滨', lng: 126.53, lat: 45.80, scene: 'snow', desc: '松花江封冻，冰雕雪塑昼夜通明，是冬日北国最盛大的景观。' },
      { name: '坝上雪原', place: '河北张家口', lng: 114.88, lat: 40.82, scene: 'snow', desc: '坝上高原积雪没草，白桦挂霜，一派塞北林海雪原风光。' },
      { name: '零度分界', place: '安徽蚌埠', lng: 117.36, lat: 32.92, scene: 'freeze', desc: '秦岭—淮河一线一月均温零度，线北河流结冰、线南基本不冻，也是南稻北麦的分界。' },
      { name: '西湖探梅', place: '浙江杭州', lng: 120.15, lat: 30.27, scene: 'bloom', desc: '腊月孤山寒梅初绽，烟雨朦胧，是江南冬天最清雅的颜色。' },
      { name: '昆明暖冬', place: '云南昆明', lng: 102.71, lat: 25.04, scene: 'mild', desc: '冬季晴暖如春，一月均温八度上下，四季如春，终年花开。' },
      { name: '海南避寒', place: '海南三亚', lng: 109.51, lat: 18.25, scene: 'mild', desc: '一月均温二十度上下，椰风海韵，是我国冬季最暖的地方。' },
      { name: '寒潮南下', place: '湖北武汉', lng: 114.30, lat: 30.60, scene: 'coldwave', desc: '强冷空气一夜可降温十余度，长江流域出现雨雪冰冻，江湖封冻。' }
    ]
  }
};

/* ---------- 基础工具 ---------- */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** 数字转汉字：1 → 一，19 → 十九，225 → 二百二十五 */
function cnNum(value) {
  const n = Math.round(Number(value) || 0);
  if (n === 0) return '零';
  if (n < 0) return '负' + cnNum(-n);
  if (n >= 10000) {
    const high = Math.floor(n / 10000);
    const low = n % 10000;
    return cnNum(high) + '万' + (low ? (low < 1000 ? '零' : '') + cnNum(low) : '');
  }
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百', '千'];
  const s = String(n);
  let out = '';
  let zero = false;
  for (let i = 0; i < s.length; i++) {
    const d = +s[i];
    const unit = units[s.length - 1 - i];
    if (d === 0) {
      zero = true;
      continue;
    }
    if (zero && out) out += '零';
    zero = false;
    // 10–19 习惯读作“十几”，不读“一十几”
    out += (d === 1 && unit === '十' && !out) ? '十' : digits[d] + unit;
  }
  return out;
}

/** 节气交节日期：十一月七—八日 */
function cnDate(t) {
  if (!t.month || !t.day) return '';
  const end = t.endDay && t.endDay !== t.day ? '—' + cnNum(t.endDay) : '';
  return `${cnNum(t.month)}月${cnNum(t.day)}${end}日`;
}

/** 把文字中的阿拉伯数字整体转成汉字，并处理“°”“月/日”的读法 */
function cnText(text) {
  return String(text || '')
    .replace(/\d+/g, m => cnNum(+m))
    .replace(/\s*°\s*/g, '度')
    .replace(/([零一二三四五六七八九十百千])\s+月/g, '$1月')
    .replace(/([零一二三四五六七八九十百千])\s+日/g, '$1日')
    .replace(/\s*—\s*/g, '—')
    .replace(/\s+/g, ' ');
}

/** 交付数据的三候自带“一候/二候/三候”前缀，独立展示时去掉，避免重复 */
function stripHou(text) {
  return String(text || '').replace(/^(初候|一候|二候|三候)\s*/, '');
}

/** 复合食俗会按子项拆成多条关系，展示时按原文合并，避免重复 */
function uniqueRelationItems(list) {
  const seen = new Set();
  return list.filter(it => {
    const key = it.relation.display_text || it.node.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ---------- 背景动效 ---------- */

const PARTICLE_COUNT = 18;
let bgLayer;

function initBgLayer() {
  bgLayer = document.getElementById('bg-layer');
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    // 景深：depth 越大越远——更小、更虚、更慢、更淡，避免生硬的单一形状
    const depth = Math.random();
    const size = 5 + (1 - depth) * 11;
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = size.toFixed(1) + 'px';
    p.style.setProperty('--blur', (0.5 + depth * 3.5).toFixed(1) + 'px');
    p.style.setProperty('--op', (0.16 + (1 - depth) * 0.34).toFixed(2));
    p.style.setProperty('--drift', (Math.random() * 170 - 85).toFixed(0) + 'px');
    p.style.animationDuration = (17 + depth * 13 + Math.random() * 8).toFixed(1) + 's';
    p.style.animationDelay = (-Math.random() * 34).toFixed(1) + 's';
    bgLayer.appendChild(p);
  }
}

function setSeason(season) {
  document.body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');
  if (season) document.body.classList.add('season-' + season);
  document.body.dataset.season = season || '';
}

/* ---------- 当前节气 ---------- */

/** 以各节气交节起始日为界，今天落在 [起始日, 下一节气起始日) 即属前一节气 */
function getCurrentTerm(terms) {
  if (!Array.isArray(terms) || terms.length === 0) return null;
  const now = new Date();
  const today = (now.getMonth() + 1) * 100 + now.getDate();

  const marks = terms
    .filter(t => t.month && t.day)
    .map(t => ({ term: t, md: t.month * 100 + t.day }))
    .sort((a, b) => a.md - b.md);
  if (marks.length === 0) return null;

  let cur = marks[marks.length - 1];
  for (const m of marks) {
    if (m.md <= today) cur = m; else break;
  }
  return cur.term;
}

/* ---------- 封面 ---------- */

function sectionCover() {
  const cur = getCurrentTerm(store.terms);
  const terms = store.terms || [];

  const today = cur ? `
    <a class="today-card anim-item" style="--i:3" href="#/term/${esc(cur.id)}">
      <span class="today-k">今日节气</span>
      <span class="today-v">${esc(cur.name)}</span>
      <span class="today-d">${esc(cnDate(cur))}</span>
      <span class="today-arrow">→</span>
    </a>` : '';

  const strip = terms.map(t => `<span>${esc(t.name)}</span>`).join('');

  return `
    <section class="panel panel-cover" data-season="" data-title="封面">
      <div class="cover-inner">
        <p class="eyebrow anim-item" style="--i:0">中国人的时间智慧</p>
        <h2 class="cover-title anim-item" style="--i:1">二十四节气</h2>
        <p class="cover-desc anim-item" style="--i:2">以太阳黄经为序，串联气候、物候、习俗与诗文<br>循着交付资料，走近一年的二十四个节点</p>
        ${today}
      </div>
      <div class="term-strip" aria-hidden="true"><div class="term-strip-track">${strip}${strip}</div></div>
      <p class="scroll-hint">向下滚动</p>
    </section>`;
}

/* ---------- 四季板块 ---------- */

function sectionSeason(season) {
  const terms = (store.terms || []).filter(t => t.season === season.key);
  if (terms.length === 0) return '';

  const cur = getCurrentTerm(store.terms);
  const first = terms[0];
  const last = terms[terms.length - 1];

  const cards = terms.map((t, i) => {
    const isCur = cur && t.id === cur.id;
    return `
      <a class="term-card season-${season.key}${isCur ? ' current' : ''}" href="#/term/${esc(t.id)}"
         style="--i:${i + 1};
                --wx:${18 + (i * 17) % 42}%; --wy:${34 + (i * 9) % 18}%;
                --wx2:${58 + (i * 13) % 28}%; --wy2:${20 + (i * 7) % 26}%">
        <span class="tc-art" aria-hidden="true"></span>
        <span class="tc-num">${cnNum(t.index + 1)}</span>
        <span class="tc-seal">${season.cn}</span>
        <span class="tc-body">
          <span class="tc-name">${esc(t.name)}</span>
          ${t.phenology[0] ? `<span class="tc-hou">${esc(t.phenology[0])}</span>` : ''}
          <span class="tc-meta">
            <span class="tc-date">${esc(cnDate(t))}</span>
            ${isCur ? '<span class="tc-now">今日</span>' : ''}
          </span>
        </span>
      </a>`;
  }).join('');

  return `
    <section class="panel panel-season season-${season.key}" data-season="${season.key}" data-title="${season.cn}">
      <div class="season-aside">
        <span class="season-glyph">${season.cn}</span>
        <h3 class="season-label">${season.cn}</h3>
        <p class="season-en">${season.en}</p>
        <p class="season-meta">${esc(first.name)} — ${esc(last.name)}<br>${cnNum(terms.length)} 个节气</p>
      </div>
      <div class="term-grid">${cards}</div>
    </section>`;
}

/* ---------- 探索板块 ---------- */

function sectionFeatures() {
  const relCount = store.counts.relations;
  const termCount = store.counts.terms;

  return `
    <section class="panel panel-features" data-season="" data-title="探索">
      <div class="features-inner">
        <p class="eyebrow anim-item" style="--i:0">EXPLORE</p>
        <h2 class="features-title anim-item" style="--i:1">继续探索</h2>
        <div class="feature-list">
          <a class="feature-card anim-item" style="--i:2" href="#/relations">
            <span class="feature-no">一</span>
            <span class="feature-main">
              <span class="feature-name">关系图谱</span>
              <span class="feature-desc">节气与物候、习俗、食俗、诗词的节点关系</span>
            </span>
            <span class="feature-count">${relCount ? `${cnNum(relCount)} 条关系` : '数据未就绪'}</span>
            <span class="feature-arrow">→</span>
          </a>
          <a class="feature-card anim-item" style="--i:3" href="#/qa">
            <span class="feature-no">二</span>
            <span class="feature-main">
              <span class="feature-name">节气问答</span>
              <span class="feature-desc">基于交付资料检索作答，无依据时如实说明</span>
            </span>
            <span class="feature-count">${termCount ? `${cnNum(termCount)} 条记录` : '数据未就绪'}</span>
            <span class="feature-arrow">→</span>
          </a>
        </div>
      </div>
    </section>`;
}

/* ---------- 数据板块 ---------- */

function sectionData() {
  const kg = store.kg;
  const terms = store.terms || [];
  const covered = terms.filter(t =>
    t.relations.phenology.length || t.relations.custom.length ||
    t.relations.food.length || t.relations.poem.length
  ).length;

  return `
    <section class="panel panel-data" data-season="" data-title="数据">
      <div class="data-inner">
        <p class="eyebrow anim-item" style="--i:0">DATA &amp; SOURCES</p>
        <h2 class="data-title anim-item" style="--i:1">数据与来源</h2>
        <div class="data-stats anim-item" style="--i:2">
          <div class="data-stat"><strong>${cnNum(terms.length)}</strong><span>节气记录</span></div>
          <div class="data-stat"><strong>${kg ? cnNum(kg.stats.nodes) : '—'}</strong><span>知识节点</span></div>
          <div class="data-stat"><strong>${kg ? cnNum(kg.stats.relations) : '—'}</strong><span>关系条目</span></div>
          <div class="data-stat"><strong>${cnNum(covered)}<em>／${cnNum(terms.length)}</em></strong><span>关系覆盖</span></div>
        </div>
        <p class="data-note anim-item" style="--i:3">基础资料包含交节规则、气候、三候、习俗、食俗、诗词、地域与出处；知识关系统一记录来源字段与资料页，可逐条回溯。资料未覆盖的内容在页面中如实标注，不做补写。</p>
      </div>
    </section>`;
}

/* ---------- 版图：3D 中国地图 ---------- */

/** 交付资料的 region 里提到多处地点：按 具体城市 → 地区泛称 → 省域 的顺序排队 */
function placeCandidates(term) {
  const text = (term.regions || []).join('；');
  const collect = list => list
    .map(([key, label, lng, lat]) => ({ key, label, lng, lat, i: text.indexOf(key) }))
    .filter(c => c.i >= 0)
    .sort((a, b) => a.i - b.i || b.key.length - a.key.length);

  return [
    ...collect(MAP_CITIES),
    ...collect(MAP_REGIONS),
    ...collect(MAP_PROVINCES.map(([key, lng, lat]) => [key, key, lng, lat]))
  ];
}

function resolveTermPlace(term) {
  return placeCandidates(term)[0] || { key: '', label: '中原', lng: 113.6, lat: 34.0, i: -1 };
}

/** 同一地点被多个节气引用时，用很小的半径在原地错开并抬高，避免光点叠成一颗 */
function buildMapPoints() {
  const used = [];
  return (store.terms || []).map(term => {
    const cands = placeCandidates(term);

    const free = cands.find(c => !used.some(u =>
      Math.abs(u.lng - c.lng) < .3 && Math.abs(u.lat - c.lat) < .25));
    if (free) {
      used.push(free);
      return { term, place: free, z: 3.4 };
    }

    const base = cands[0] || { key: '', label: '中原', lng: 113.6, lat: 34.0 };
    const n = used.filter(u => u.label === base.label).length;
    const r = .34 + n * .14;
    const a = n * 2.4 - Math.PI / 3;
    const place = {
      ...base,
      lng: base.lng + Math.cos(a) * r,
      lat: base.lat + Math.sin(a) * r
    };
    used.push(place);
    return { term, place, z: 3.4 + (n + 1) * 1.1 };
  });
}

function shortProvince(name) {
  return String(name).replace(/(壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区|省|市)$/, '');
}

function mapLegendHtml(key) {
  const s = MAP_SEASONS[key] || MAP_SEASONS.spring;
  const sceneKeys = [...new Set(s.marks.map(m => m.scene).filter(k => MAP_SCENE_STYLE[k]))];
  return [
    ...s.bands.map(b => `<span><i style="background:${b.color}"></i>${esc(b.label)}</span>`),
    ...s.lines.map(l => `<span><i class="is-line" style="background:${l.color}"></i>${esc(l.label)}</span>`),
    ...sceneKeys.map(k => {
      const st = MAP_SCENE_STYLE[k];
      return `<span><i class="is-scene sym-${esc(st.symbol)}" style="background:${st.color}"></i>${esc(st.label)}</span>`;
    }),
    '<span><i class="is-dot"></i>节气现场</span>'
  ].join('');
}

/** 左侧季候说明：随季节切换，交代整体气候与物候背景 */
function mapSeasonNote(key) {
  const s = MAP_SEASONS[key] || MAP_SEASONS.spring;
  return `
    <p class="msn-head">${s.cn} · ${esc(s.range)}</p>
    <p class="msn-text">${esc(s.climate)}</p>
    <p class="msn-hou">${esc(s.phenology)}</p>`;
}

function defaultMapSeason() {
  const t = getCurrentTerm(store.terms) || (store.terms || [])[0];
  return t && MAP_SEASONS[t.season] ? t.season : 'spring';
}

function sectionMap() {
  if (!(store.terms || []).length) return '';
  const key = defaultMapSeason();

  return `
    <section class="panel panel-map" data-season="" data-title="版图">
      <div class="map-aside">
        <p class="eyebrow anim-item" style="--i:0">TERROIR OF TIME</p>
        <h2 class="map-title anim-item" style="--i:1">节气版图</h2>
        <p class="map-desc anim-item" style="--i:2">二十四节气起于黄河流域，气候却因山川纬度的不同而南北殊异。切换四季，看同一片土地上的寒暑与物候推移。</p>
        <div class="map-tabs anim-item" style="--i:3" role="tablist" aria-label="季节图层">
          ${SEASONS.map(s => `<button type="button" class="map-tab${s.key === key ? ' active' : ''}" data-season-key="${s.key}" role="tab" aria-selected="${s.key === key}">${s.cn}</button>`).join('')}
        </div>
        <div class="map-legend anim-item" style="--i:4" id="map-legend">${mapLegendHtml(key)}</div>
        <div class="map-season-note anim-item" style="--i:5" id="map-season-note">${mapSeasonNote(key)}</div>
      </div>
      <div class="map-stage anim-item" style="--i:2">
        <div class="map-canvas" id="map-canvas"><p class="map-loading">正在绘制版图……</p></div>
        <p class="map-hint">拖动旋转 · 滚轮缩放 · 悬浮符号看风景</p>
      </div>
    </section>`;
}

let mapChart = null;
let chinaGeoPromise = null;
let mapResizeBound = false;

function loadChinaGeo() {
  if (!chinaGeoPromise) {
    chinaGeoPromise = fetch('data/china.json').then(res => {
      if (!res.ok) throw new Error('china.json ' + res.status);
      return res.json();
    });
  }
  return chinaGeoPromise;
}

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (err) {
    return false;
  }
}

async function setupMapPanel(container) {
  const el = container.querySelector('#map-canvas');
  if (!el) return;

  if (typeof echarts === 'undefined') {
    el.innerHTML = '<p class="map-loading">地图组件未加载</p>';
    return;
  }
  if (!hasWebGL()) {
    el.innerHTML = '<p class="map-loading">当前浏览器未启用 WebGL，无法绘制立体版图</p>';
    return;
  }

  let geo;
  try {
    geo = await loadChinaGeo();
  } catch (err) {
    el.innerHTML = '<p class="map-loading">地图数据读取失败</p>';
    return;
  }
  if (!document.body.contains(el)) return;

  const points = buildMapPoints();
  const provinceNames = (geo.features || [])
    .map(f => f.properties && f.properties.name)
    .filter(Boolean);
  const matchProvince = short => provinceNames.find(n => shortProvince(n) === short) || '';

  echarts.registerMap('china', geo);

  el.innerHTML = '';
  mapChart = echarts.init(el);

  function buildOption(key) {
    const s = MAP_SEASONS[key] || MAP_SEASONS.spring;
    const regions = [];
    const matched = new Set();
    s.bands.forEach(b => b.provinces.forEach(short => {
      const full = matchProvince(short);
      if (full) {
        matched.add(full);
        regions.push({
          name: full,
          regionHeight: b.height,
          itemStyle: {
            color: b.color,
            opacity: .96,
            borderWidth: .8,
            borderColor: 'rgba(31, 29, 25, .32)'
          }
        });
      }
    }));
    /* 无名要素（南海诸岛）压平并弱化，避免在低纬度挤出漂浮碎柱 */
    (geo.features || []).forEach(f => {
      const n = f.properties && f.properties.name;
      if (!n || !matched.has(n)) {
        regions.push({
          name: n || '',
          regionHeight: .5,
          itemStyle: { color: '#e3d9c4', opacity: .8, borderWidth: .5 }
        });
      }
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        appendToBody: true,
        backgroundColor: 'rgba(251, 248, 240, .98)',
        borderColor: 'rgba(31, 29, 25, .16)',
        borderWidth: 1,
        padding: 0,
        extraCssText: 'max-width:284px;box-shadow:0 18px 44px rgba(31,29,25,.22);border-radius:4px;overflow:hidden;',
        textStyle: { color: '#1f1d19', fontSize: 12, lineHeight: 20 },
        formatter: p => {
          if (p.seriesName === '季节景色') {
            const m = s.marks[p.dataIndex];
            const st = m && MAP_SCENE_STYLE[m.scene];
            if (!m) return '';
            return `
              <div class="scene-tip">
                <img class="scene-tip-img" src="img/scenes/${m.scene}.jpg" alt="${esc(m.name)}" loading="lazy"/>
                <div class="scene-tip-body">
                  <p class="scene-tip-name">${esc(m.name)}<span>${esc(m.place)}</span></p>
                  ${st ? `<p class="scene-tip-tag" style="--tag-c:${st.color}">${esc(st.label)}</p>` : ''}
                  <p class="scene-tip-desc">${esc(m.desc)}</p>
                </div>
              </div>`;
          }
          if (p.seriesName === '节气现场') {
            const it = points[p.dataIndex];
            return it ? `<div class="scene-tip-mini"><b>${esc(it.term.name)}</b>　${esc(it.place.label)}<br/>${esc(it.term.climate)}</div>` : '';
          }
          return '';
        }
      },
      geo3D: {
        map: 'china',
        roam: true,
        boxWidth: 104,
        boxHeight: 16,
        regionHeight: 2.8,
        itemStyle: {
          color: '#efe7d6',
          opacity: 1,
          borderWidth: .7,
          borderColor: 'rgba(31, 29, 25, .28)'
        },
        regions,
        emphasis: {
          itemStyle: { color: '#e4d7bd' },
          label: { show: true, color: '#1f1d19', fontSize: 11 }
        },
        label: { show: false, formatter: p => shortProvince(p.name) },
        shading: 'lambert',
        light: {
          main: { intensity: s.light.main.intensity, color: s.light.main.color, shadow: false, alpha: 46, beta: 26 },
          ambient: { intensity: s.light.ambient.intensity }
        },
        viewControl: {
          alpha: 46, beta: 6, distance: 92,
          autoRotate: false,
          minDistance: 58, maxDistance: 190,
          animationDurationUpdate: 900,
          animationEasingUpdate: 'cubicInOut'
        },
        groundPlane: { show: false }
      },
      series: [
        {
          name: '季节界线',
          type: 'lines3D',
          coordinateSystem: 'geo3D',
          polyline: true,
          silent: true,
          lineStyle: { width: 2.2, opacity: .85 },
          data: s.lines.map(l => ({
            coords: l.coords.map(([lng, lat]) => [lng, lat, 5.6]),
            lineStyle: { color: l.color }
          }))
        },
        {
          name: '季节景色',
          type: 'scatter3D',
          coordinateSystem: 'geo3D',
          symbol: 'circle',
          symbolSize: 10,
          itemStyle: { borderWidth: 1.2, borderColor: '#fbf8f0', opacity: .96 },
          label: { show: false },
          emphasis: { label: { show: false }, itemStyle: { color: '#a9432f' }, scale: 1.5 },
          data: s.marks.map(m => {
            const st = MAP_SCENE_STYLE[m.scene] || MAP_SCENE_STYLE.bloom;
            return {
              name: m.name,
              symbol: st.symbol,
              symbolSize: st.size,
              value: [m.lng, m.lat, (st.symbol === 'pin' ? 7.0 : 6.3)],
              itemStyle: { color: st.color, borderWidth: 1.2, borderColor: '#fbf8f0', opacity: .97 }
            };
          })
        },
        {
          name: '节气现场',
          type: 'scatter3D',
          coordinateSystem: 'geo3D',
          symbol: 'circle',
          symbolSize: 5.6,
          itemStyle: { borderWidth: 1, borderColor: '#fbf8f0', opacity: .9 },
          label: { show: false },
          emphasis: { label: { show: false }, itemStyle: { color: '#a9432f' }, scale: 1.6 },
          data: points.map(p => ({
            name: p.term.name,
            value: [p.place.lng, p.place.lat, (p.z || 3.4) + 1.9],
            itemStyle: { color: MAP_SEASON_COLOR[p.term.season] },
            termId: p.term.id
          }))
        }
      ]
    };
  }

  let seasonKey = MAP_SEASONS[defaultMapSeason()] ? defaultMapSeason() : 'spring';
  let flying = false;

  function paint(key) {
    seasonKey = key;
    mapChart.setOption(buildOption(key), true);
    const aside = container.querySelector('.map-aside');
    if (!aside) return;
    aside.querySelectorAll('.map-tab').forEach(btn => {
      const on = btn.dataset.seasonKey === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const legend = aside.querySelector('#map-legend');
    if (legend) legend.innerHTML = mapLegendHtml(key);
    const note = aside.querySelector('#map-season-note');
    if (note) note.innerHTML = mapSeasonNote(key);
  }

  /* 立体演示：只做由远及近的推入，不自动旋转；用户可自行拖动查看 */
  function flyIn(startDistance) {
    if (flying || !mapChart) return;
    flying = true;
    const from = { distance: startDistance || 196, alpha: 60 };
    const to = { distance: 92, alpha: 46 };
    const t0 = performance.now();
    const tick = now => {
      if (!mapChart) { flying = false; return; }
      const k = Math.min(1, (now - t0) / 1200);
      const e = 1 - Math.pow(1 - k, 3);
      mapChart.setOption({
        geo3D: {
          viewControl: {
            autoRotate: false,
            distance: from.distance + (to.distance - from.distance) * e,
            alpha: from.alpha + (to.alpha - from.alpha) * e
          }
        }
      });
      if (k < 1) {
        requestAnimationFrame(tick);
      } else {
        flying = false;
        if (mapChart) mapChart.setOption({ geo3D: { viewControl: { autoRotate: false } } });
      }
    };
    requestAnimationFrame(tick);
  }

  /* 画布氛围层：春花瓣 / 夏雨丝 / 秋落叶 / 冬飞雪，纯 CSS 动画，不遮挡操作 */
  function ensureFxLayer() {
    let fx = el.querySelector('.map-fx');
    if (!fx) {
      fx = document.createElement('div');
      fx.className = 'map-fx';
      el.appendChild(fx);
    }
    return fx;
  }
  function paintFx(key) {
    const fx = ensureFxLayer();
    fx.className = 'map-fx fx-' + key;
    const count = 16;
    fx.innerHTML = Array.from({ length: count }, (_, i) => {
      const left = (i * 6.3 + (i % 4) * 3.1) % 100;
      const delay = (i % 8) * .9;
      const dur = 7 + (i % 5) * 1.6;
      const drift = ((i * 37) % 60) - 30;
      const size = 5 + (i % 4) * 2;
      return `<i style="left:${left.toFixed(1)}%;animation-delay:${delay.toFixed(1)}s;animation-duration:${dur.toFixed(1)}s;--drift:${drift}px;--size:${size}px"></i>`;
    }).join('');
  }

  paint(seasonKey);
  paintFx(seasonKey);

  container.querySelectorAll('.map-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.seasonKey;
      if (!MAP_SEASONS[key] || key === seasonKey) return;
      paint(key);
      paintFx(key);
      flyIn(150);
    });
  });

  /* 风景在悬浮 tooltip 中呈现；点击节气现场点可直达节气资料页 */
  mapChart.on('click', p => {
    if (p.seriesName === '节气现场') {
      const it = points[p.dataIndex];
      if (it && it.term && it.term.id) location.hash = '#/term/' + it.term.id;
    }
  });

  /* 滚到版图这一屏时才播放推近，避免在首屏空播 */
  const panel = container.querySelector('.panel-map');
  if (panel && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) {
        io.disconnect();
        flyIn();
      }
    }, { threshold: .4 });
    io.observe(panel);
  } else {
    flyIn();
  }

  if (!mapResizeBound) {
    mapResizeBound = true;
    window.addEventListener('resize', () => { if (mapChart) mapChart.resize(); });
  }
}

/* ---------- 全屏翻页 ---------- */

function renderScrollPage() {
  const container = document.getElementById('scroll-container');
  const panels = [
    sectionCover(),
    sectionMap(),
    ...SEASONS.map(sectionSeason),
    sectionFeatures(),
    sectionData()
  ].filter(Boolean);

  if (mapChart) { mapChart.dispose(); mapChart = null; }
  container.innerHTML = panels.join('');
  setupMapPanel(container);

  const dots = document.getElementById('section-dots');
  const sections = [...container.querySelectorAll('.panel')];
  dots.innerHTML = sections.map((s, i) =>
    `<a class="dot" data-idx="${i}" title="${esc(s.dataset.title)}"></a>`
  ).join('');

  dots.querySelectorAll('.dot').forEach(d => {
    d.addEventListener('click', () => {
      const target = sections[+d.dataset.idx];
      if (!target) return;
      /* mandatory 吸附会打断平滑滚动，跳转期间暂时关闭，结束后恢复 */
      container.style.scrollSnapType = 'none';
      container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      window.setTimeout(() => { container.style.scrollSnapType = ''; }, 700);
    });
  });

  const animObserver = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
    const topIdx = sections.findIndex(s => s.classList.contains('in-view'));
    document.body.classList.toggle('header-solid', topIdx > 0);
  }, { threshold: 0.25 });
  sections.forEach(s => animObserver.observe(s));

  const snapObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const idx = sections.indexOf(e.target);
      dots.querySelectorAll('.dot').forEach(d => d.classList.toggle('active', +d.dataset.idx === idx));
      setSeason(e.target.dataset.season || null);
    });
  }, { threshold: 0.55 });
  sections.forEach(s => snapObserver.observe(s));
}

/* ---------- 节气详情 ---------- */

function renderTermDetail(termId) {
  const container = document.getElementById('scroll-container');
  const terms = store.terms || [];
  const t = terms.find(x => x.id === termId);

  if (!t) {
    container.innerHTML = `
      <section class="panel subpage-panel"><div class="subpage">
        ${emptyState(`未找到节气「${termId || ''}」`)}
      </div></section>`;
    return;
  }

  setSeason(t.season);

  const idx = terms.indexOf(t);
  const prev = terms[idx - 1];
  const next = terms[idx + 1];

  const hou = t.phenology.map((x, i) => `
    <div class="hou">
      <span class="hou-label">${HOU_LABELS[i] || `${cnNum(i + 1)}候`}</span>
      <span class="hou-text">${esc(stripHou(x))}</span>
    </div>`).join('');

  const customs = t.customs.length
    ? `<div class="tag-list">${t.customs.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>`
    : `<p class="muted">资料未覆盖</p>`;

  const foods = t.foods.length
    ? `<ul class="food-list">${t.foods.map(f => {
        const i = f.search(/[：:]/);
        return i > 0
          ? `<li><span class="food-label">${esc(f.slice(0, i))}</span>${esc(f.slice(i + 1))}</li>`
          : `<li>${esc(f)}</li>`;
      }).join('')}</ul>`
    : `<p class="muted">资料未覆盖</p>`;

  const regions = t.regions.length
    ? `<div class="tag-list">${t.regions.map(r => `<span class="tag">${esc(r)}</span>`).join('')}</div>`
    : `<p class="muted">资料未覆盖</p>`;

  const sources = t.sources.length
    ? `<ul class="source-list">${t.sources.map(s => `
        <li>${s.url
          ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.text)}</a>`
          : esc(s.text)}</li>`).join('')}</ul>`
    : `<p class="muted">资料未覆盖</p>`;

  const poem = t.poem
    ? `<section class="d-card d-wide poem-card">
        <h3>诗词</h3>
        <p class="poem-line">${esc(t.poem.content)}</p>
        <cite class="poem-cite">${esc(t.poem.title)}</cite>
      </section>`
    : `<section class="d-card d-wide"><h3>诗词</h3><p class="muted">资料未收录</p></section>`;

  const relCounts = `
    <div class="kg-preview">
      <span><strong>${cnNum(uniqueRelationItems(t.relations.phenology).length)}</strong>物候</span>
      <span><strong>${cnNum(uniqueRelationItems(t.relations.custom).length)}</strong>习俗</span>
      <span><strong>${cnNum(uniqueRelationItems(t.relations.food).length)}</strong>食俗</span>
      <span><strong>${cnNum(uniqueRelationItems(t.relations.poem).length)}</strong>诗词</span>
    </div>
    <a class="text-link" href="#/relations/${esc(t.id)}">在图谱中查看 →</a>`;

  container.innerHTML = `
    <section class="panel subpage-panel">
      <div class="subpage detail season-${esc(t.season)}">
        <a class="back-link" href="#cover">← 返回总览</a>

        <header class="detail-hero">
          <div>
            <p class="detail-kicker">第${cnNum(t.index + 1)}节气 · ${esc(t.seasonCn)}</p>
            <h2 class="detail-title">${esc(t.name)}</h2>
            <p class="detail-rule">${t.sun ? `太阳黄经${cnNum(t.sun)}度　｜　` : ''}${esc(cnText(t.calendar))}</p>
          </div>
          <span class="detail-glyph" aria-hidden="true">${esc(t.seasonCn)}</span>
        </header>

        <div class="detail-grid">
          <section class="d-card d-wide"><h3>气候</h3><p>${esc(t.climate) || '资料未覆盖'}</p></section>

          <section class="d-card d-wide"><h3>三候</h3>
            ${hou ? `<div class="hou-row">${hou}</div>` : '<p class="muted">资料未覆盖</p>'}
          </section>

          <section class="d-card"><h3>习俗</h3>${customs}</section>
          <section class="d-card"><h3>食俗</h3>${foods}</section>

          ${poem}

          <section class="d-card"><h3>关联地域</h3>${regions}</section>
          <section class="d-card"><h3>知识关系</h3>${relCounts}</section>

          <section class="d-card d-wide"><h3>资料来源</h3>${sources}</section>
        </div>

        <nav class="term-pager">
          ${prev ? `<a class="pager-link" href="#/term/${esc(prev.id)}"><span>← 上一节气</span>${esc(prev.name)}</a>` : '<span></span>'}
          ${next ? `<a class="pager-link pager-next" href="#/term/${esc(next.id)}"><span>下一节气 →</span>${esc(next.name)}</a>` : '<span></span>'}
        </nav>
      </div>
    </section>`;
}

/* ---------- 关系图谱 ---------- */

const KG_CATEGORY = {
  phenology: { color: '#6f8b57', angle: -50 },
  custom:    { color: '#a9432f', angle: 50 },
  food:      { color: '#b06e39', angle: 130 },
  poem:      { color: '#3e7c99', angle: 230 }
};

function shortText(text, max = 8) {
  const s = String(text || '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/** 以当前节气为中心、四类关系为分支的径向关系图 */
function buildKgGraph(cur) {
  const W = 1000, H = 640, CX = 500, CY = 320;
  const HUB_R = 138, LEAF_R = 234;
  const edges = [], hubs = [], leaves = [];

  const branches = REL_GROUPS.map(g => ({
    key: g.key,
    label: g.label,
    color: KG_CATEGORY[g.key].color,
    angle: KG_CATEGORY[g.key].angle,
    items: uniqueRelationItems(cur.relations[g.key])
  }));

  branches.forEach(b => {
    const rad = b.angle * Math.PI / 180;
    const hx = CX + HUB_R * Math.cos(rad);
    const hy = CY + HUB_R * Math.sin(rad);

    edges.push(`<line class="kg-edge" x1="${CX}" y1="${CY}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" style="--c:${b.color}"/>`);
    hubs.push(`<g class="kg-hub" style="--c:${b.color}">
      <rect x="${(hx - 45).toFixed(1)}" y="${(hy - 17).toFixed(1)}" width="90" height="34" rx="17"/>
      <text x="${hx.toFixed(1)}" y="${(hy + 4).toFixed(1)}" text-anchor="middle">${b.label} · ${cnNum(b.items.length)}</text>
    </g>`);

    if (b.items.length === 0) {
      const lx = CX + (LEAF_R - 16) * Math.cos(rad);
      const ly = CY + (LEAF_R - 16) * Math.sin(rad);
      leaves.push(`<text class="kg-empty" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" style="--c:${b.color}">资料未收录</text>`);
      return;
    }

    const n = b.items.length;
    const span = n === 1 ? 0 : Math.min(74, 17 * n);

    b.items.forEach((it, i) => {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const a = (b.angle + t * span) * Math.PI / 180;
      const r = LEAF_R + (i % 3) * 22;
      const x = CX + r * Math.cos(a);
      const y = CY + r * Math.sin(a);
      const label = it.relation.display_text || it.node.name;
      const cos = Math.cos(a), sin = Math.sin(a);
      const anchor = cos > .28 ? 'start' : cos < -.28 ? 'end' : 'middle';
      const dx = anchor === 'start' ? 10 : anchor === 'end' ? -10 : 0;
      const dy = anchor === 'middle' ? (sin < 0 ? -12 : 18) : 4;

      edges.push(`<line class="kg-edge thin" x1="${hx.toFixed(1)}" y1="${hy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="--c:${b.color}"/>`);
      leaves.push(`<g class="kg-leaf" style="--c:${b.color}" data-key="${esc(label)}">
        <title>${esc(label)}</title>
        <circle class="kg-hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14"/>
        <circle class="kg-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>
        <text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}">${esc(shortText(label))}</text>
      </g>`);
    });
  });

  return `
    <div class="kg-graph-card">
      <div class="kg-graph-cap">
        <span>关系网络 · ${esc(cur.name)}</span>
        <span class="kg-graph-hint">点击图中节点，可在下方定位对应条目</span>
      </div>
      <div class="kg-graph-scroll">
        <svg class="kg-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cur.name)}关系图谱">
          <circle class="kg-ring" cx="${CX}" cy="${CY}" r="258"/>
          <circle class="kg-ring subtle" cx="${CX}" cy="${CY}" r="190"/>
          <g>${edges.join('')}</g>
          <g>${hubs.join('')}</g>
          <g>${leaves.join('')}</g>
          <g class="kg-center">
            <circle class="kg-center-halo" cx="${CX}" cy="${CY}" r="78"/>
            <circle class="kg-center-ring" cx="${CX}" cy="${CY}" r="56"/>
            <text class="kg-center-name" x="${CX}" y="${CY - 2}" text-anchor="middle">${esc(cur.name)}</text>
            <text class="kg-center-sub" x="${CX}" y="${CY + 22}" text-anchor="middle">第${cnNum(cur.index + 1)}节气 · ${esc(cur.seasonCn)}</text>
          </g>
        </svg>
      </div>
    </div>`;
}

function renderRelations(selectedId) {
  const container = document.getElementById('scroll-container');
  const kg = store.kg;
  const terms = store.terms || [];
  setSeason(null);

  if (!kg || terms.length === 0) {
    container.innerHTML = `<section class="panel subpage-panel"><div class="subpage">
      ${emptyState('关系数据未就绪')}
    </div></section>`;
    return;
  }

  const cur = terms.find(t => t.id === selectedId) ||
    getCurrentTerm(terms) || terms[0];

  const termPicker = SEASONS.map(s => {
    const list = terms.filter(t => t.season === s.key);
    if (!list.length) return '';
    return `
      <div class="kg-term-group">
        <p class="kg-term-group-label season-${s.key}">${s.cn}</p>
        <div class="kg-term-buttons">
          ${list.map(t => `<a class="kg-term-btn${t.id === cur.id ? ' active' : ''}" href="#/relations/${esc(t.id)}">${esc(t.name)}</a>`).join('')}
        </div>
      </div>`;
  }).join('');

  const total = REL_GROUPS.reduce((sum, g) => sum + uniqueRelationItems(cur.relations[g.key]).length, 0);

  const groups = REL_GROUPS.map(g => {
    const items = uniqueRelationItems(cur.relations[g.key]);
    const first = items[0];
    return `
      <section class="kg-group" data-group="${g.key}">
        <h4>${g.label}<span>${cnNum(items.length)}</span></h4>
        ${items.length
          ? `<div class="kg-chips">${items.map(it => `
              <span class="kg-chip" data-key="${esc(it.relation.display_text || it.node.name)}" title="${esc(it.relation.source_value || it.node.name)}">${esc(it.relation.display_text || it.node.name)}</span>`).join('')}</div>`
          : '<p class="muted">资料未收录</p>'}
        ${first && first.relation.source_url
          ? `<a class="kg-source" href="${esc(first.relation.source_url)}" target="_blank" rel="noopener">资料页 ↗</a>`
          : ''}
      </section>`;
  }).join('');

  container.innerHTML = `
    <section class="panel subpage-panel">
      <div class="subpage relations">
        <a class="back-link" href="#cover">← 返回总览</a>

        <div class="subpage-head">
          <p class="eyebrow">KNOWLEDGE GRAPH</p>
          <h2 class="subpage-title">关系图谱</h2>
          <p class="subpage-desc">二十四节气节点与物候、习俗、食俗、诗词相连，每条关系都保留源字段与资料页，可逐条回溯。</p>
          <div class="subpage-stats">
            <div><strong>${cnNum(terms.length)}</strong><span>节气</span></div>
            <div><strong>${cnNum(kg.stats.nodes)}</strong><span>节点</span></div>
            <div><strong>${cnNum(kg.stats.relations)}</strong><span>关系</span></div>
            <div><strong>${cnNum(kg.stats.typeCounts.phenology || 0)}</strong><span>物候</span></div>
            <div><strong>${cnNum(kg.stats.typeCounts.custom || 0)}</strong><span>习俗</span></div>
            <div><strong>${cnNum(kg.stats.typeCounts.food || 0)}</strong><span>食俗</span></div>
          </div>
        </div>

        ${buildKgGraph(cur)}

        <div class="kg-layout">
          <aside class="kg-terms">${termPicker}</aside>
          <div class="kg-detail">
            <div class="kg-detail-head">
              <div>
                <h3>${esc(cur.name)}</h3>
                <p class="kg-detail-meta">${esc(cnDate(cur))} · 共${cnNum(total)}条关系</p>
              </div>
              <a class="text-link" href="#/term/${esc(cur.id)}">查看节气资料 →</a>
            </div>
            ${groups}
          </div>
        </div>
      </div>
    </section>`;

  bindKgGraph(container);
}

/** 点击图谱叶节点，定位并高亮下方对应条目 */
function bindKgGraph(container) {
  const leaves = container.querySelectorAll('.kg-leaf');
  if (!leaves.length) return;

  leaves.forEach(leaf => {
    leaf.addEventListener('click', () => {
      const key = leaf.dataset.key;
      const chip = [...container.querySelectorAll('.kg-chip')]
        .find(el => el.dataset.key === key);
      if (!chip) return;
      chip.scrollIntoView({ block: 'center', behavior: 'smooth' });
      chip.classList.remove('is-flash');
      void chip.offsetWidth;
      chip.classList.add('is-flash');
      setTimeout(() => chip.classList.remove('is-flash'), 1600);
    });
  });
}

/* ---------- 节气问答 ---------- */

function qaExamples() {
  const t = getCurrentTerm(store.terms) || (store.terms || [])[0];
  if (!t) return [];
  return [
    `${t.name}的三候是什么？`,
    `${t.name}有什么习俗？`,
    `${t.name}吃什么？`,
    `${t.name}有什么诗词？`,
    `${t.name}在哪些地区？`
  ];
}

function renderQa() {
  const container = document.getElementById('scroll-container');
  const examples = qaExamples();
  const cur = getCurrentTerm(store.terms);
  setSeason(null);

  container.innerHTML = `
    <section class="panel subpage-panel">
      <div class="subpage qa">
        <a class="back-link" href="#cover">← 返回总览</a>

        <div class="subpage-head qa-shell">
          <p class="eyebrow">ASK THE SOLAR TERMS</p>
          <h2 class="subpage-title">节气问答</h2>
          <p class="subpage-desc">回答直接取自交付的节气表与知识关系${cur ? `，当前节气为「${esc(cur.name)}」` : ''}。资料没有覆盖的问题会如实说明，不做推测。</p>

          <form class="qa-form" id="qa-form">
            <input class="qa-input" id="qa-input" type="text" autocomplete="off"
              placeholder="试着问：${esc(cur ? cur.name : '立春')}的三候是什么？">
            <button class="qa-submit" type="submit">提问</button>
          </form>

          <div class="qa-examples">
            ${examples.map(q => `<button class="qa-example" type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
          </div>

          <div class="qa-answer" id="qa-answer">
            <p class="muted">输入问题，或点选上方示例开始。</p>
          </div>

          <p class="qa-note">说明：AI 生成结果（ai/results.json）尚未接入，当前为基于交付资料的知识检索式回答。</p>
        </div>
      </div>
    </section>`;

  const form = document.getElementById('qa-form');
  const input = document.getElementById('qa-input');

  form.addEventListener('submit', e => {
    e.preventDefault();
    askQuestion(input.value);
  });

  document.querySelectorAll('.qa-example').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.q;
      askQuestion(btn.dataset.q);
    });
  });
}

function askQuestion(q) {
  const box = document.getElementById('qa-answer');
  if (!box) return;
  const text = String(q || '').trim();
  if (!text) return;
  box.innerHTML = renderAnswer(answerQuestion(text));
}

function answerQuestion(q) {
  const terms = store.terms || [];
  const term = terms.find(t => q.includes(t.name)) ||
    ((/今天|现在|当前/.test(q) && getCurrentTerm(terms)) || null);

  if (term) return answerTerm(term, q);

  /* 没有节气名时，尝试匹配知识关系中的实体 */
  if (store.kg) {
    const hits = store.kg.raw.nodes
      .filter(n => n.type !== 'solar_term' && n.name && n.name.length >= 2 && q.includes(n.name))
      .sort((a, b) => b.name.length - a.name.length);

    if (hits.length) {
      const entity = hits[0];
      const rels = store.kg.raw.relations.filter(r => r.to === entity.id);
      const fromIds = [...new Set(rels.map(r => r.from))];
      const froms = fromIds.map(id => store.kg.nodeById.get(id)).filter(Boolean);

      if (froms.length) {
        const evidence = [...new Set(rels.map(r => r.source_url).filter(Boolean))]
          .map(url => ({ text: '资料页', url }));
        return {
          tag: '关联查询',
          title: `「${entity.name}」`,
          body: `<p>在交付资料中，「${esc(entity.name)}」与以下节气相关：</p>
            <div class="tag-list">${froms.map(n =>
              `<a class="tag" href="#/term/${esc(n.id)}">${esc(n.name)}</a>`).join('')}</div>`,
          evidence
        };
      }
    }
  }

  return { miss: true, question: q };
}

function answerTerm(t, q) {
  const intents = [];
  if (/三候|物候|候/.test(q)) intents.push('phenology');
  if (/习俗|风俗|传统|活动/.test(q)) intents.push('custom');
  if (/吃|食|喝|饮/.test(q)) intents.push('food');
  if (/诗词|诗句|诗文|诗|词/.test(q)) intents.push('poem');
  if (/气候|天气|气温|温度|冷暖/.test(q)) intents.push('climate');
  if (/时间|日期|什么时候|几月|几号|交节/.test(q)) intents.push('rule');
  if (/地域|地区|哪里|地方|省份/.test(q)) intents.push('region');
  if (/来源|出处|资料|依据/.test(q)) intents.push('sources');
  if (intents.length === 0) intents.push('overview');

  const hou = t.phenology.map((x, i) => `
    <div class="hou">
      <span class="hou-label">${HOU_LABELS[i] || `${cnNum(i + 1)}候`}</span>
      <span class="hou-text">${esc(stripHou(x))}</span>
    </div>`).join('');

  const foodItems = t.foods.map(f => {
    const i = f.search(/[：:]/);
    return i > 0
      ? `<li><span class="food-label">${esc(f.slice(0, i))}</span>${esc(f.slice(i + 1))}</li>`
      : `<li>${esc(f)}</li>`;
  }).join('');

  const blocks = {
    phenology: () => `<div class="qa-block"><p class="qa-block-label">三候</p><div class="hou-row">${hou}</div></div>`,
    custom: () => `<div class="qa-block"><p class="qa-block-label">习俗</p>${t.customs.length
      ? `<div class="tag-list">${t.customs.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>`
      : '<p class="muted">资料未覆盖</p>'}</div>`,
    food: () => `<div class="qa-block"><p class="qa-block-label">食俗</p>${foodItems
      ? `<ul class="food-list">${foodItems}</ul>` : '<p class="muted">资料未覆盖</p>'}</div>`,
    poem: () => `<div class="qa-block"><p class="qa-block-label">诗词</p>${t.poem
      ? `<p class="poem-line">${esc(t.poem.content)}</p><cite class="poem-cite">${esc(t.poem.title)}</cite>`
      : '<p class="muted">资料未收录</p>'}</div>`,
    climate: () => `<div class="qa-block"><p class="qa-block-label">气候</p><p>${esc(t.climate) || '资料未覆盖'}</p></div>`,
    rule: () => `<div class="qa-block"><p class="qa-block-label">交节时间</p><p>${esc(cnText(t.term_rule))}</p></div>`,
    region: () => `<div class="qa-block"><p class="qa-block-label">关联地域</p>${t.regions.length
      ? `<div class="tag-list">${t.regions.map(r => `<span class="tag">${esc(r)}</span>`).join('')}</div>`
      : '<p class="muted">资料未覆盖</p>'}</div>`,
    sources: () => `<div class="qa-block"><p class="qa-block-label">资料来源</p><ul class="source-list">${t.sources.map(s =>
      `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.text)}</a>` : esc(s.text)}</li>`).join('')}</ul></div>`,
    overview: () => [
      blocks.climate(),
      blocks.phenology(),
      blocks.custom()
    ].join('')
  };

  const labels = {
    phenology: '三候', custom: '习俗', food: '食俗', poem: '诗词',
    climate: '气候', rule: '时间', region: '地域', sources: '来源', overview: '概览'
  };

  return {
    tag: '节气资料',
    title: `${t.name} · ${intents.map(k => labels[k]).join('、')}`,
    body: intents.map(k => blocks[k]()).join(''),
    evidence: t.sources.filter(s => s.url),
    termId: t.id,
    termName: t.name
  };
}

function renderAnswer(ans) {
  if (!ans) return '<p class="muted">请输入一个问题。</p>';

  if (ans.miss) {
    return `
      <div class="qa-answer-head">
        <span class="qa-answer-tag">资料未覆盖</span>
        <span class="qa-answer-title">${esc(ans.question)}</span>
      </div>
      <div class="qa-answer-body">
        <p>交付的节气表与知识关系中没有能支撑这个问题的记录，这里不做推测。</p>
        <p class="muted">可以试着问某个节气的三候、习俗、食俗、诗词、地域或交节时间。</p>
      </div>`;
  }

  const evidence = ans.evidence && ans.evidence.length
    ? `<div class="qa-evidence">依据：${ans.evidence.map(e =>
        e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.text)}</a>` : esc(e.text)
      ).join(' · ')}</div>`
    : '';

  const link = ans.termId
    ? `<p class="qa-note"><a class="text-link" href="#/term/${esc(ans.termId)}">查看「${esc(ans.termName)}」完整资料 →</a></p>`
    : '';

  return `
    <div class="qa-answer-head">
      <span class="qa-answer-tag">${esc(ans.tag)}</span>
      <span class="qa-answer-title">${esc(ans.title)}</span>
    </div>
    <div class="qa-answer-body">${ans.body}</div>
    ${evidence}${link}`;
}

/* ---------- 空状态 ---------- */

function emptyState(title) {
  const missing = store.problems.length
    ? `<ul>${store.problems.map(p => `<li class="missing">✕ ${esc(p)}</li>`).join('')}</ul>`
    : '';
  return `
    <div class="empty-state">
      <h2>${esc(title)}</h2>
      <p>数据未就绪，本页面不使用写死内容。</p>
      ${missing || '<p>请确认交付目录中的 solar_terms.json 与 relations.json 可访问。</p>'}
    </div>`;
}

/* ---------- 路由 ---------- */

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const parts = h.split('/');
  return { name: parts[0] || 'cover', param: parts[1] };
}

function render() {
  const { name, param } = parseHash();
  const container = document.getElementById('scroll-container');
  const dots = document.getElementById('section-dots');
  const isScroll = name === 'cover' || name === 'overview';

  document.body.classList.remove('header-solid');
  document.body.classList.toggle('is-subpage', !isScroll);
  dots.style.display = isScroll ? '' : 'none';

  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('active', a.dataset.nav === name);
  });

  const views = {
    cover:     renderScrollPage,
    overview:  renderScrollPage,
    term:      () => renderTermDetail(param),
    relations: () => renderRelations(param),
    qa:        renderQa
  };

  if (isScroll) setSeason(null);
  (views[name] || renderScrollPage)();

  /* 子页面切换时立即回到顶部，避免被 scroll-behavior 拖成平滑滚动 */
  container.style.scrollBehavior = 'auto';
  container.scrollTop = 0;
  container.style.scrollBehavior = '';
}

/* ---------- 启动 ---------- */

async function init() {
  initBgLayer();
  store = await loadAllData();
  renderDataStatus(store);

  const container = document.getElementById('scroll-container');
  container.addEventListener('scroll', () => {
    if (!document.body.classList.contains('is-subpage')) return;
    document.body.classList.toggle('header-solid', container.scrollTop > 10);
  }, { passive: true });

  window.addEventListener('hashchange', render);
  render();
}

init();
