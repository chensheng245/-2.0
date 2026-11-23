/* ことばの森 — application logic */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const STORAGE_KEY = 'kotoba-mori-progress-v1';
  const ARCHIVE_KEY = 'kotoba-mori-archive-v1';
  const BACKUP_FORMAT = 'kotoba-mori-backup';
  const BACKUP_VERSION = 1;
  const ARCHIVE_INBOX = 'folder-inbox';
  const LIBRARY_PAGE_SIZE = 40;
  const N5_SCENES_DATA = typeof N5_SCENES !== 'undefined' ? N5_SCENES : [];
  const N5_SECTIONS_DATA = typeof N5_SECTIONS !== 'undefined' ? N5_SECTIONS : [];
  const N4_SCENES_DATA = typeof N4_SCENES !== 'undefined' ? N4_SCENES : [];
  const N4_SECTIONS_DATA = typeof N4_SECTIONS !== 'undefined' ? N4_SECTIONS : [];
  const N3_SCENES_DATA = typeof N3_SCENES !== 'undefined' ? N3_SCENES : [];
  const N3_SECTIONS_DATA = typeof N3_SECTIONS !== 'undefined' ? N3_SECTIONS : [];
  const N2_SCENES_DATA = typeof N2_SCENES !== 'undefined' ? N2_SCENES : [];
  const N2_SECTIONS_DATA = typeof N2_SECTIONS !== 'undefined' ? N2_SECTIONS : [];
  const levelScenes = {
    N5: N5_SCENES_DATA,
    N4: N4_SCENES_DATA,
    N3: N3_SCENES_DATA,
    N2: N2_SCENES_DATA
  };
  const allScenes = [
    ...N5_SCENES_DATA,
    ...N4_SCENES_DATA,
    ...N3_SCENES_DATA,
    ...N2_SCENES_DATA
  ];
  const sceneMap = Object.fromEntries(allScenes.map((scene) => [scene.id, scene]));
  const sectionMap = Object.fromEntries(
    [...N5_SECTIONS_DATA, ...N4_SECTIONS_DATA, ...N3_SECTIONS_DATA, ...N2_SECTIONS_DATA].map(
      (section) => [section.id, section]
    )
  );
  const levelMap = Object.fromEntries(LEVELS.map((level) => [level.id, level]));
  const wordMap = new Map(VOCAB.map((word) => [word.id, word]));
  const wordOrder = new Map(VOCAB.map((word, index) => [word.id, index]));

  const dictionarySceneGroups = typeof DICTIONARY_SCENE_GROUPS !== 'undefined'
    ? DICTIONARY_SCENE_GROUPS
    : SCENES;
  const dictionarySceneMap = Object.fromEntries(
    dictionarySceneGroups.map((scene) => [scene.id, scene])
  );
  const dictionarySceneOrder = new Map(
    dictionarySceneGroups.map((scene, index) => [scene.id, index])
  );
  const dictionarySceneByChapter = typeof DICTIONARY_SCENE_BY_CHAPTER !== 'undefined'
    ? DICTIONARY_SCENE_BY_CHAPTER
    : {};
  const dictionaryDefinitions = typeof DICTIONARY_DEFINITIONS !== 'undefined'
    ? DICTIONARY_DEFINITIONS
    : {};
  const dictionaryKanjiReadings = typeof DICTIONARY_KANJI_READINGS !== 'undefined'
    ? DICTIONARY_KANJI_READINGS
    : {};

  const EXACT_SCENE_WORDS = {
    '家': 'home', 'いえ': 'home', '住む': 'home', '住': 'home', '部屋': 'home', 'へや': 'home',
    '人': 'people', '男': 'people', '女': 'people', 'おとこ': 'people', 'おんな': 'people',
    '花': 'nature', 'はな': 'nature', '山': 'nature', '海': 'nature', '川': 'nature', '星': 'nature',
    '肉': 'food', '魚': 'food', '鱼': 'food', '茶': 'food', 'おちゃ': 'food', '酒': 'food',
    '飯': 'food', '饭': 'food', '菜': 'food', '水': 'food',
    '薬': 'health', '药': 'health', '病': 'health',
    '買う': 'shopping', '买': 'shopping', '売る': 'shopping', '卖': 'shopping',
    'お金': 'shopping', '钱': 'shopping',
    '本': 'study', '书': 'study', '課': 'study', '课': 'study',
    '時間': 'time', '时间': 'time', '時': 'time', '时': 'time'
  };

  const SEMANTIC_SCENE_RULES = [
    ['health', ['医院', '生病', '疾病', '受伤', '发烧', '感冒', '治疗', '健康', '身体', '医生', '护士', '诊', '呕吐', '腹泻', '骨折', '过敏']],
    ['time', ['时间', '小时', '分钟', '星期', '今天', '明天', '昨天', '早上', '中午', '晚上', '每天', '时候', '期间', '期限', '日期', '年代', '世纪', '月份']],
    ['town', ['车站', '电车', '火车', '地铁', '公共汽车', '自行车', '道路', '地图', '城市', '城镇', '街', '银行', '邮局', '公园', '桥', '交通', '驾驶', '停车', '十字路口', '信号']],
    ['food', ['食物', '面包', '牛奶', '咖啡', '味道', '料理', '餐厅', '菜单', '鸡蛋', '蔬菜', '水果', '点心', '便当', '饮食', '饮料']],
    ['study', ['学校', '学习', '老师', '学生', '教室', '图书馆', '考试', '作业', '词典', '单词', '日语', '语言', '教育', '研究', '练习', '知识']],
    ['work', ['公司', '工作', '会议', '加班', '出差', '上司', '同事', '职业', '工厂', '职场', '面试', '工资', '营业', '事务']],
    ['home', ['房间', '厨房', '浴室', '门口', '搬家', '房租', '家具', '公寓', '住宅', '住房']],
    ['nature', ['天气', '雨', '雪', '风', '云', '晴', '树', '动物', '猫', '狗', '鸟', '季节', '自然', '太阳', '月亮', '地震', '台风', '大海', '海洋']],
    ['shopping', ['价格', '便宜', '商店', '购物', '付款', '收据', '折扣', '信用卡', '零钱', '账单']],
    ['travel', ['旅行', '旅游', '观光', '酒店', '宾馆', '机场', '护照', '行李', '假期', '温泉', '景点', '机票']],
    ['hobby', ['音乐', '电影', '运动', '爱好', '唱歌', '跳舞', '游泳', '棒球', '足球', '摄影', '游戏', '绘画', '乐器', '演唱会']],
    ['mind', ['心情', '感觉', '喜欢', '讨厌', '高兴', '悲伤', '寂寞', '害怕', '担心', '生气', '性格', '意见', '印象', '表情', '感情', '不安', '惊讶']],
    ['society', ['社会', '新闻', '报纸', '经济', '政治', '法律', '犯罪', '事件', '政府', '国际', '文化', '选举', '人口']],
    ['people', ['家人', '父母', '兄弟', '姐妹', '朋友', '孩子', '大人', '自己', '对方', '客人', '恋人', '夫妇', '亲属', '人们']]
  ];

  function semanticSceneFor(word) {
    const exact = EXACT_SCENE_WORDS[word.word] || EXACT_SCENE_WORDS[word.meaning];
    if (exact) return exact;
    const text = `${word.meaning || ''} ${word.word || ''}`;
    for (const [sceneId, keywords] of SEMANTIC_SCENE_RULES) {
      if (keywords.some((keyword) => text.includes(keyword))) return sceneId;
    }
    return '';
  }

  function sceneGroupFor(word) {
    return semanticSceneFor(word) || dictionarySceneByChapter[word?.scene] || 'other';
  }

  VOCAB.forEach((word) => {
    const groupId = sceneGroupFor(word);
    const group = dictionarySceneMap[groupId];
    const record = dictionaryDefinitions[word.id];
    word.sceneGroup = groupId;
    word.definitionJa = record?.[0] ||
      `「${word.word}」を表す日本語。${group?.jp || ''}の場面で使われる。`;
    word.definitionSource = record?.[1] || 'original';
  });
  const archiveWordIndex = new Map();
  VOCAB.forEach((word) => {
    const wordKey = normalizeArchiveSurface(word.word);
    const readingKey = normalizeArchiveSurface(word.reading);
    if (wordKey && !archiveWordIndex.has(wordKey)) archiveWordIndex.set(wordKey, word);
    if (readingKey && !archiveWordIndex.has(readingKey)) archiveWordIndex.set(readingKey, word);
  });
  const wordsByLevel = Object.fromEntries(
    LEVELS.map((level) => [level.id, VOCAB.filter((word) => word.level === level.id)])
  );

  function scenesForLevel(levelId = state.level) {
    return levelScenes[levelId] || SCENES;
  }

  const ICONS = {
    arrow: '<path d="M4 12h14M12 6l6 6-6 6"/>',
    check: '<path d="m5 12 4.5 4.5L20 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    speaker: '<path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>',
    shuffle: '<path d="M4 7h3c4 0 4 10 8 10h5M16 4l4 3-4 3M4 17h3c1.4 0 2.3-1.2 3.2-2.6M16 14l4 3-4 3"/>',
    greetings: '<path d="M4 5.5h16v10H9l-4 3v-3H4z"/><path d="M8 9h8M8 12.5h5"/>',
    food: '<path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M8 11V8M12 11V5.5M16 11V8M3 19.5h18"/>',
    shopping: '<path d="M5.5 8h13l1 12h-15z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    travel: '<rect x="5" y="3.5" width="14" height="13" rx="3"/><path d="M7.5 20l2-3.5M16.5 20l-2-3.5M7.5 9.5h9M9 13h.01M15 13h.01"/>',
    study: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20M8 7h8M8 10h5"/>',
    work: '<rect x="3.5" y="7" width="17" height="12" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17M10 12.5v2h4v-2"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/><path d="M5.5 5.5 4 4M18.5 5.5 20 4"/>',
    friends: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5M16 5.7a3 3 0 0 1 0 5.8M17 15.3c2.1.5 3.3 2 3.6 4.7"/>',
    news: '<path d="M4 5h13v14H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M7 8h7M7 11h7M7 14h4M17 8h3v9a2 2 0 0 1-2 2"/>',
    world: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5Z"/>',
    hobby: '<path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    home: '<path d="m3 11 9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
    nature: '<circle cx="8.5" cy="8" r="3.2"/><path d="M8.5 2v1.4M8.5 12.6V14M2 8h1.4M13.6 8H15M3.5 3l1 1M12.5 12l1 1M13.5 3l-1 1M4.5 12l-1 1"/><path d="M8 18.5h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.5 1.1A3 3 0 0 0 8 18.5Z"/>',
    health: '<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.6 12 20 12 20Z"/><path d="M8 12h2l1.2-2.4L13 14l1-2h2"/>',
    feelings: '<path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7 3.5C19 15.6 12 20 12 20Z"/><path d="M18.5 3.5v3M17 5h3M4.5 4v2M3.5 5h2"/>'
  };

  const state = {
    level: 'N5',
    learned: new Set(),
    daily: { date: todayKey(), ids: new Set() },
    quizBest: {},
    wrong: new Map(),
    wrongLevel: 'all',
    wrongScene: 'all',
    masteredLevel: 'all',
    masteredScene: 'all',
    sceneFilter: 'all',
    sectionFilter: 'all',
    statusFilter: 'all',
    query: '',
    visibleCount: LIBRARY_PAGE_SIZE,
    study: null,
    quiz: null,
    lastFocus: null,
    archive: {
      folders: [],
      texts: [],
      clicked: new Map(),
      folderFilter: 'all',
      clickedLevel: 'all',
      clickedScene: 'all',
      openTextId: null
    },
    sceneDict: {
      sceneId: '',
      query: ''
    }
  };

  let jaVoice = null;
  let jaVoices = [];
  let selectedVoiceKey = '';
  let activeSpeechButton = null;
  let searchTimer = null;
  let archiveSpeech = {
    active: false,
    text: '',
    position: 0,
    utterance: null,
    timer: null,
    basePosition: 0,
    startedAt: 0,
    lastBoundaryAt: 0,
    paused: false
  };

  /* ── Utilities ─────────────────────────────────────────── */

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return entities[character];
    });
  }

  function normalizeArchiveSurface(value) {
    return String(value)
      .normalize('NFC')
      .replace(/[〈（(][^〉）)]*[〉）)]/g, '')
      .replace(/[～~]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  function deinflectSurface(value) {
    const surface = normalizeArchiveSurface(value);
    if (!surface) return [];
    const candidates = new Set([surface]);
    const add = (candidate) => {
      if (candidate && candidate.length > 1) candidates.add(candidate);
    };
    const godanLast = {
      'き': 'く', 'ぎ': 'ぐ', 'し': 'す', 'ち': 'つ', 'に': 'ぬ',
      'び': 'ぶ', 'み': 'む', 'り': 'る', 'い': 'う'
    };
    const addVerbBases = (stem) => {
      if (!stem) return;
      add(`${stem}る`);
      const last = stem.slice(-1);
      if (godanLast[last]) add(`${stem.slice(0, -1)}${godanLast[last]}`);
      if (last === 'し') add(`${stem.slice(0, -1)}する`);
      if (last === '来' || last === 'き') add('来る');
      if (last === 'っ') {
        ['う', 'く', 'つ', 'る', 'む', 'ぶ', 'ぬ'].forEach((ending) => {
          add(`${stem.slice(0, -1)}${ending}`);
        });
      }
      if (last === 'ん') {
        ['む', 'ぶ', 'ぬ'].forEach((ending) => {
          add(`${stem.slice(0, -1)}${ending}`);
        });
      }
    };
    const addAdjectiveBase = (stem) => {
      if (!stem) return;
      if (stem.endsWith('く')) add(`${stem.slice(0, -1)}い`);
      else if (stem.endsWith('かっ')) add(`${stem.slice(0, -1)}い`);
      else if (stem.endsWith('けれ')) add(`${stem.slice(0, -1)}い`);
      else add(`${stem}い`);
    };

    const suffixes = [
      'ませんでした', 'ません', 'ました', 'ます', 'ませんか', 'ましたか',
      'なかった', 'ない', 'た', 'だ', 'て', 'で', 'ば', 'ず', 'ぬ',
      'たい', 'ながら', 'そう', 'れる', 'られる', 'せる', 'させる',
      'なさい', 'ろ', 'よ'
    ];
    suffixes.forEach((suffix) => {
      if (!surface.endsWith(suffix) || surface.length <= suffix.length) return;
      const stem = surface.slice(0, -suffix.length);
      addVerbBases(stem);
      if (['た', 'だ', 'て', 'で', 'ない', 'なかった', 'ば'].includes(suffix)) {
        addAdjectiveBase(stem);
      }
      if (suffix === 'そう') addAdjectiveBase(stem);
      if (suffix === 'く') addAdjectiveBase(stem);
    });

    if (surface.endsWith('かった')) add(`${surface.slice(0, -3)}い`);
    if (surface.endsWith('くて')) add(`${surface.slice(0, -2)}い`);
    if (surface.endsWith('ければ')) add(`${surface.slice(0, -3)}い`);
    if (surface.endsWith('さ')) add(`${surface.slice(0, -1)}い`);
    if (surface.endsWith('く')) add(`${surface.slice(0, -1)}い`);

    return [...candidates];
  }

  function archiveTokenKey(surface, word) {
    return word ? `w:${word.id}` : `s:${normalizeArchiveSurface(surface)}`;
  }

  function countBand(count) {
    if (count >= 1 && count <= 3) return 'green';
    if (count >= 4 && count <= 6) return 'blue';
    if (count >= 7 && count <= 9) return 'purple';
    if (count === 10) return 'red';
    return 'normal';
  }

  function countBandLabel(count) {
    const labels = { green: '绿色 · 1〜3回', blue: '蓝色 · 4〜6回', purple: '紫色 · 7〜9回', red: '红色 · 10回' };
    return labels[countBand(count)] || '尚未回看';
  }

  function countStatusText(clickResult, fallbackCount = 0) {
    if (clickResult?.reset) {
      return '10回を超えたので、0に戻しました。単語の色も元に戻りました。';
    }
    const count = Number(clickResult?.count ?? fallbackCount) || 0;
    if (clickResult?.first) {
      return '已标色归档。再点一次，右下角显示回看次数。';
    }
    return `回看 ${count} / 10 回 · ${countBandLabel(count)}。`;
  }

  function archiveId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function archiveDateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }

  function todayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function uniqueBy(items, key) {
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item[key])) return false;
      seen.add(item[key]);
      return true;
    });
  }

  function toHiragana(value) {
    return value.replace(/[\u30a1-\u30f6]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60)
    );
  }

  function normalizeSearch(value) {
    return toHiragana(String(value).toLowerCase().trim())
      .replace(/\[/g, '（')
      .replace(/\]/g, '）');
  }

  function formatCount(value) {
    return new Intl.NumberFormat('zh-CN').format(value);
  }

  function setLongClass(element, text) {
    const length = Array.from(String(text)).length;
    element.classList.remove('is-long', 'is-very-long');
    if (length >= 14) {
      element.classList.add('is-very-long');
    } else if (length >= 10) {
      element.classList.add('is-long');
    }
  }

  function isFormField(element) {
    return Boolean(element && element.closest('input, textarea, select, [contenteditable="true"]'));
  }

  function isInteractive(element) {
    return Boolean(
      element && element.closest('button, a, input, textarea, select, [role="button"]')
    );
  }

  /* ── Persistence ───────────────────────────────────────── */

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved && levelMap[saved.level]) {
        state.level = saved.level;
      }

      if (saved && Array.isArray(saved.learned)) {
        state.learned = new Set(saved.learned.filter((id) => wordMap.has(id)));
      }

      if (saved && saved.daily && saved.daily.date === todayKey() && Array.isArray(saved.daily.ids)) {
        state.daily = {
          date: saved.daily.date,
          ids: new Set(saved.daily.ids.filter((id) => wordMap.has(id)))
        };
      }

      if (saved && saved.quizBest && typeof saved.quizBest === 'object') {
        LEVELS.forEach((level) => {
          const value = Number(saved.quizBest[level.id]);
          if (Number.isFinite(value) && value >= 0) {
            state.quizBest[level.id] = Math.min(10, Math.round(value));
          }
        });
      }

      if (saved && saved.wrong && typeof saved.wrong === 'object' && !Array.isArray(saved.wrong)) {
        Object.entries(saved.wrong).forEach(([wordId, info]) => {
          if (!wordMap.has(wordId)) return;
          const count = Number(info && info.count);
          state.wrong.set(wordId, {
            count: Number.isFinite(count) && count > 0 ? Math.round(count) : 1,
            lastWrong: info && typeof info.lastWrong === 'string' ? info.lastWrong : '',
            lastSource: info && info.lastSource === 'unfamiliar' ? 'unfamiliar' : 'quiz',
            unfamiliar: info && Number.isFinite(Number(info.unfamiliar)) ? Number(info.unfamiliar) : 0,
            quizWrong: info && Number.isFinite(Number(info.quizWrong)) ? Number(info.quizWrong) : 0
          });
        });
      }
    } catch (error) {
      /* Local storage can be unavailable when the page is opened via file://. */
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          level: state.level,
          learned: [...state.learned],
          daily: { date: state.daily.date, ids: [...state.daily.ids] },
          quizBest: state.quizBest,
          wrong: Object.fromEntries(
            [...state.wrong.entries()].map(([wordId, info]) => [
              wordId,
              {
                count: info.count,
                lastWrong: info.lastWrong,
                lastSource: info.lastSource,
                unfamiliar: info.unfamiliar,
                quizWrong: info.quizWrong
              }
            ])
          )
        })
      );
    } catch (error) {
      /* Keep learning even if storage is blocked. */
    }
  }

  function persistArchive() {
    try {
      window.localStorage.setItem(
        ARCHIVE_KEY,
        JSON.stringify({
          version: 1,
          folders: state.archive.folders,
          texts: state.archive.texts,
          clicked: [...state.archive.clicked.values()]
        })
      );
      return true;
    } catch (error) {
      showToast('归档保存失败：浏览器存储空间可能已满');
      return false;
    }
  }

  /* ── Backup / restore ──────────────────────────────────── */

  function backupProgress() {
    return {
      version: 1,
      level: state.level,
      learned: [...state.learned],
      daily: { date: state.daily.date, ids: [...state.daily.ids] },
      quizBest: { ...state.quizBest },
      wrong: Object.fromEntries([...state.wrong.entries()].map(([wordId, info]) => [wordId, {
        count: info.count,
        lastWrong: info.lastWrong,
        lastSource: info.lastSource,
        unfamiliar: info.unfamiliar,
        quizWrong: info.quizWrong
      }]))
    };
  }

  function backupArchive() {
    return {
      version: 1,
      folders: state.archive.folders.map((folder) => ({ ...folder })),
      texts: state.archive.texts.map((text) => ({ ...text })),
      clicked: [...state.archive.clicked.values()].map((entry) => ({ ...entry }))
    };
  }

  function backupText(value, maxLength = 200000) {
    return typeof value === 'string' ? value.slice(0, maxLength) : '';
  }

  function backupProgressFrom(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const learned = Array.isArray(source.learned)
      ? [...new Set(source.learned.filter((id) => typeof id === 'string' && wordMap.has(id)))]
      : [];
    const daily = source.daily && typeof source.daily === 'object'
      ? {
          date: backupText(source.daily.date, 40),
          ids: Array.isArray(source.daily.ids)
            ? [...new Set(source.daily.ids.filter((id) => typeof id === 'string' && wordMap.has(id)))]
            : []
        }
      : { date: todayKey(), ids: [] };
    const quizBest = {};
    LEVELS.forEach((level) => {
      const value = Number(source.quizBest?.[level.id]);
      if (Number.isFinite(value) && value >= 0) quizBest[level.id] = Math.min(10, Math.round(value));
    });
    const wrong = {};
    if (source.wrong && typeof source.wrong === 'object' && !Array.isArray(source.wrong)) {
      Object.entries(source.wrong).forEach(([wordId, info]) => {
        if (!wordMap.has(wordId) || !info || typeof info !== 'object') return;
        wrong[wordId] = {
          count: Math.max(1, Math.round(Number(info.count) || 1)),
          lastWrong: backupText(info.lastWrong, 40),
          lastSource: info.lastSource === 'unfamiliar' ? 'unfamiliar' : 'quiz',
          unfamiliar: Math.max(0, Number(info.unfamiliar) || 0),
          quizWrong: Math.max(0, Number(info.quizWrong) || 0)
        };
      });
    }
    return {
      version: 1,
      level: levelMap[source.level] ? source.level : state.level,
      learned,
      daily,
      quizBest,
      wrong
    };
  }

  function backupArchiveFrom(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const now = new Date().toISOString();
    const folders = [];
    const folderIds = new Set();
    (Array.isArray(source.folders) ? source.folders : []).forEach((folder, index) => {
      if (!folder || typeof folder !== 'object') return;
      const id = backupText(folder.id, 100) || `folder-import-${index + 1}`;
      const name = backupText(folder.name, 30).trim();
      if (!name || folderIds.has(id)) return;
      folderIds.add(id);
      folders.push({ id, name, createdAt: backupText(folder.createdAt, 40) || now });
    });
    if (!folderIds.has(ARCHIVE_INBOX)) {
      folders.unshift({ id: ARCHIVE_INBOX, name: '未分类', createdAt: now });
      folderIds.add(ARCHIVE_INBOX);
    }

    const texts = [];
    const textIds = new Set();
    (Array.isArray(source.texts) ? source.texts : []).forEach((text, index) => {
      if (!text || typeof text !== 'object') return;
      const id = backupText(text.id, 100) || `text-import-${index + 1}`;
      const content = backupText(text.content, 200000).replace(/\r\n/g, '\n');
      if (!content.trim() || textIds.has(id)) return;
      textIds.add(id);
      texts.push({
        id,
        folderId: folderIds.has(text.folderId) ? text.folderId : ARCHIVE_INBOX,
        title: backupText(text.title, 60).trim() || archiveTitleFromContent(content),
        content,
        createdAt: backupText(text.createdAt, 40) || now,
        updatedAt: backupText(text.updatedAt, 40) || now
      });
    });

    const clickedSource = Array.isArray(source.clicked)
      ? source.clicked
      : source.clicked && typeof source.clicked === 'object' ? Object.values(source.clicked) : [];
    const clicked = [];
    const clickedKeys = new Set();
    clickedSource.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const surface = backupText(entry.surface || entry.headword, 120);
      if (!surface) return;
      const word = entry.wordId ? wordMap.get(entry.wordId) : null;
      const key = backupText(entry.key, 160) || archiveTokenKey(surface, word);
      if (clickedKeys.has(key)) return;
      const rawCount = Number(entry.count);
      const count = !Number.isFinite(rawCount) || rawCount > 10 ? 0 : Math.max(0, Math.round(rawCount));
      clickedKeys.add(key);
      clicked.push({
        key,
        surface,
        headword: backupText(entry.headword, 120) || word?.word || surface,
        wordId: word?.id || backupText(entry.wordId, 80),
        level: word?.level || backupText(entry.level, 10) || 'unlisted',
        scene: word?.scene || backupText(entry.scene, 80),
        sceneGroup: word?.sceneGroup || backupText(entry.sceneGroup, 40) || 'other',
        section: word?.section || backupText(entry.section, 80),
        reading: word?.reading || backupText(entry.reading, 80),
        meaning: word?.meaning || backupText(entry.meaning, 120),
        definitionJa: word?.definitionJa || backupText(entry.definitionJa, 400),
        count,
        firstAt: backupText(entry.firstAt, 40) || now,
        lastAt: backupText(entry.lastAt, 40) || now
      });
    });
    return { version: 1, folders, texts, clicked };
  }

  function backupParse(raw) {
    if (!raw || typeof raw !== 'object' || raw.format !== BACKUP_FORMAT || !raw.data) {
      throw new Error('这不是「ことばの森」的备份文件');
    }
    if (!raw.data.progress && !raw.data.archive) {
      throw new Error('备份里没有可导入的数据');
    }
    return {
      progress: backupProgressFrom(raw.data.progress),
      archive: backupArchiveFrom(raw.data.archive),
      voice: backupText(raw.data.preferences?.voice, 200)
    };
  }

  function backupMergeProgress(current, incoming) {
    const sameDay = current.daily?.date && current.daily.date === incoming.daily?.date;
    const quizBest = { ...current.quizBest };
    Object.entries(incoming.quizBest).forEach(([level, value]) => {
      quizBest[level] = Math.max(Number(quizBest[level]) || 0, Number(value) || 0);
    });
    const wrong = { ...current.wrong };
    Object.entries(incoming.wrong).forEach(([wordId, info]) => {
      const old = wrong[wordId];
      if (!old) {
        wrong[wordId] = { ...info };
      } else {
        const newer = (info.lastWrong || '') > (old.lastWrong || '');
        wrong[wordId] = {
          count: Math.max(old.count, info.count),
          lastWrong: newer ? info.lastWrong : old.lastWrong,
          lastSource: newer ? info.lastSource : old.lastSource,
          unfamiliar: Math.max(old.unfamiliar || 0, info.unfamiliar || 0),
          quizWrong: Math.max(old.quizWrong || 0, info.quizWrong || 0)
        };
      }
    });
    return {
      version: 1,
      level: current.level,
      learned: [...new Set([...current.learned, ...incoming.learned])],
      daily: sameDay
        ? { date: current.daily.date, ids: [...new Set([...current.daily.ids, ...incoming.daily.ids])] }
        : current.daily,
      quizBest,
      wrong
    };
  }

  function backupMergeArchive(current, incoming) {
    const folders = current.folders.map((folder) => ({ ...folder }));
    const folderIds = new Set(folders.map((folder) => folder.id));
    incoming.folders.forEach((folder) => {
      if (folderIds.has(folder.id)) return;
      folders.push({ ...folder });
      folderIds.add(folder.id);
    });
    if (!folderIds.has(ARCHIVE_INBOX)) {
      folders.unshift({ id: ARCHIVE_INBOX, name: '未分类', createdAt: new Date().toISOString() });
    }
    const texts = current.texts.map((text) => ({ ...text }));
    const textIds = new Set(texts.map((text) => text.id));
    incoming.texts.forEach((text) => {
      if (textIds.has(text.id)) return;
      texts.push({ ...text });
      textIds.add(text.id);
    });
    const clicked = new Map(current.clicked.map((entry) => [entry.key, { ...entry }]));
    incoming.clicked.forEach((entry) => {
      const old = clicked.get(entry.key);
      if (!old || entry.count > old.count) clicked.set(entry.key, { ...entry });
    });
    return { version: 1, folders, texts, clicked: [...clicked.values()] };
  }

  function backupApply(parsed, mode) {
    const progress = mode === 'replace'
      ? parsed.progress
      : backupMergeProgress(backupProgress(), parsed.progress);
    const archive = mode === 'replace'
      ? parsed.archive
      : backupMergeArchive(backupArchive(), parsed.archive);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
      if (parsed.voice) {
        window.localStorage.setItem('kotoba-mori-voice-v1', parsed.voice);
      } else if (mode === 'replace') {
        window.localStorage.removeItem('kotoba-mori-voice-v1');
      }
    } catch (error) {
      throw new Error('浏览器存储失败，可能是空间不足');
    }
  }

  function openDataModal() {
    const status = $('#importStatus');
    if (status) {
      status.classList.remove('is-error');
      status.textContent = '尚未选择文件';
    }
    $('#dataTextCount').textContent = String(state.archive.texts.length);
    $('#dataClickedCount').textContent = String(state.archive.clicked.size);
    $('#dataLearnedCount').textContent = String(state.learned.size);
    $('#dataWrongCount').textContent = String(state.wrong.size);
    openModal($('#dataModal'));
  }

  function downloadBackup() {
    const now = new Date();
    let voice = '';
    try {
      voice = window.localStorage.getItem('kotoba-mori-voice-v1') || '';
    } catch (error) {
      voice = '';
    }
    const pad = (value) => String(value).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const payload = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      app: 'ことばの森',
      exportedAt: now.toISOString(),
      data: {
        progress: backupProgress(),
        archive: backupArchive(),
        preferences: { voice }
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kotoba-mori-backup-${stamp}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    showToast('已导出全部数据');
  }

  async function importBackupFile(event) {
    const file = event.target.files?.[0];
    const status = $('#importStatus');
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      status.classList.add('is-error');
      status.textContent = '导入失败：文件超过 20MB';
      event.target.value = '';
      return;
    }
    status.classList.remove('is-error');
    status.textContent = `正在读取「${file.name}」…`;
    try {
      const parsed = backupParse(JSON.parse(await file.text()));
      const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'merge';
      if (mode === 'replace' && !window.confirm('覆盖导入会替换当前全部归档、点击词和学习进度，确定继续吗？')) {
        status.textContent = '已取消导入';
        return;
      }
      backupApply(parsed, mode);
      status.textContent = '导入成功，正在刷新页面…';
      showToast('数据导入成功');
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      status.classList.add('is-error');
      status.textContent = `导入失败：${error.message || '文件格式不正确'}`;
    } finally {
      event.target.value = '';
    }
  }

  function loadArchive() {
    const now = new Date().toISOString();
    const inbox = { id: ARCHIVE_INBOX, name: '未分类', createdAt: now };
    state.archive = {
      folders: [inbox],
      texts: [],
      clicked: new Map(),
      folderFilter: 'all',
      clickedLevel: 'all',
      clickedScene: 'all',
      openTextId: null
    };

    try {
      const raw = window.localStorage.getItem(ARCHIVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;

      const folders = [];
      (Array.isArray(saved.folders) ? saved.folders : []).forEach((folder) => {
        if (!folder || typeof folder.name !== 'string') return;
        const id = typeof folder.id === 'string' && folder.id ? folder.id : archiveId('folder');
        if (folders.some((item) => item.id === id)) return;
        const name = folder.name.trim().slice(0, 30);
        if (!name) return;
        folders.push({
          id,
          name,
          createdAt: typeof folder.createdAt === 'string' ? folder.createdAt : now
        });
      });
      if (!folders.some((folder) => folder.id === ARCHIVE_INBOX)) folders.unshift(inbox);
      state.archive.folders = folders;

      const folderIds = new Set(folders.map((folder) => folder.id));
      (Array.isArray(saved.texts) ? saved.texts : []).forEach((text) => {
        if (!text || typeof text.content !== 'string' || !text.content.trim()) return;
        const content = text.content.replace(/\r\n/g, '\n').trim();
        const folderId = folderIds.has(text.folderId) ? text.folderId : ARCHIVE_INBOX;
        state.archive.texts.push({
          id: typeof text.id === 'string' && text.id ? text.id : archiveId('text'),
          folderId,
          title: typeof text.title === 'string' && text.title.trim()
            ? text.title.trim().slice(0, 60)
            : archiveTitleFromContent(content),
          content,
          createdAt: typeof text.createdAt === 'string' ? text.createdAt : now,
          updatedAt: typeof text.updatedAt === 'string' ? text.updatedAt : now
        });
      });

      const clickedList = Array.isArray(saved.clicked)
        ? saved.clicked
        : saved.clicked && typeof saved.clicked === 'object'
          ? Object.values(saved.clicked)
          : [];
      clickedList.forEach((entry) => {
        if (!entry || typeof entry.surface !== 'string' || !entry.surface.trim()) return;
        const surface = entry.surface.normalize('NFC');
        const word = entry.wordId
          ? wordMap.get(entry.wordId)
          : lookupArchiveWord(surface);
        const key = typeof entry.key === 'string' && entry.key
          ? entry.key
          : archiveTokenKey(surface, word);
        const rawCount = Number(entry.count);
        const legacy = !(typeof entry.key === 'string' && entry.key);
        const count = legacy
          ? Math.max(1, Number.isFinite(rawCount) ? Math.round(rawCount) : 1)
          : (Number.isFinite(rawCount) ? Math.max(0, Math.round(rawCount)) : 0);
        const sceneGroup = word?.sceneGroup || entry.sceneGroup || 'other';
        state.archive.clicked.set(key, {
          key,
          surface,
          headword: word?.word || entry.headword || surface,
          wordId: word?.id || (typeof entry.wordId === 'string' ? entry.wordId : ''),
          level: word?.level || (typeof entry.level === 'string' ? entry.level : 'unlisted'),
          scene: word?.scene || (typeof entry.scene === 'string' ? entry.scene : ''),
          sceneGroup,
          section: word?.section || (typeof entry.section === 'string' ? entry.section : ''),
          reading: word?.reading || (typeof entry.reading === 'string' ? entry.reading : ''),
          meaning: word?.meaning || (typeof entry.meaning === 'string' ? entry.meaning : ''),
          definitionJa: word?.definitionJa || (typeof entry.definitionJa === 'string' ? entry.definitionJa : ''),
          count,
          firstAt: typeof entry.firstAt === 'string' ? entry.firstAt : now,
          lastAt: typeof entry.lastAt === 'string' ? entry.lastAt : now
        });
      });
    } catch (error) {
      /* Keep the archive usable for this session even if storage is unavailable. */
    }
  }

  function rolloverDay() {
    const key = todayKey();
    if (state.daily.date === key) return false;
    state.daily = { date: key, ids: new Set() };
    persist();
    renderHero();
    updateTodayCount();
    return true;
  }

  /* ── Rendering ─────────────────────────────────────────── */

  function renderAll() {
    renderLevels();
    renderScenes();
    renderFilterChips();
    renderSectionFilter();
    renderLibrary(true);
    renderHero();
    updateQuizSummary();
    updateTodayCount();
    updateWrongSummary();
    updateMasteredSummary();
    updateArchiveStats();
  }

  function renderLevels() {
    $('#levelGrid').innerHTML = LEVELS.map((level) => {
      const words = wordsByLevel[level.id];
      const learned = words.filter((word) => state.learned.has(word.id)).length;
      const percent = Math.round((learned / words.length) * 100);
      const active = state.level === level.id;

      return `
        <article class="level-card${active ? ' is-active' : ''}"
          role="button" tabindex="0" data-level="${level.id}"
          aria-pressed="${active}" aria-label="切换到 ${level.id} ${level.zh}"
          style="--level-accent:${level.accent};--level-soft:${level.soft}">
          <span class="level-top">
            <span class="level-code">${level.id}</span>
            <span class="level-jp">${level.jp}</span>
          </span>
          <h3 class="level-title">${level.zh}</h3>
          <span class="level-desc">${level.desc}</span>
          <span class="level-progress">
            <span class="level-progress-head">
              <span>${learned} / ${words.length} 已掌握</span>
              <strong>${percent}%</strong>
            </span>
            <span class="level-track"><i style="width:${percent}%"></i></span>
          </span>
        </article>
      `;
    }).join('');
  }

  function renderScenes() {
    if ($('#activeLevelBadge')) {
      $('#activeLevelBadge').textContent = `${dictionarySceneGroups.length} の場面 · ${VOCAB.length.toLocaleString('ja-JP')} 語`;
    }

    $('#sceneGrid').innerHTML = dictionarySceneGroups.map((scene, index) => {
      const words = VOCAB.filter((word) => word.sceneGroup === scene.id);
      const learned = words.filter((word) => state.learned.has(word.id)).length;
      const percent = words.length ? Math.round((learned / words.length) * 100) : 0;
      const preview = words
        .slice(0, 3)
        .map((word) => `<span lang="ja">${escapeHTML(word.word)}</span>`)
        .join('');

      return `
        <article class="scene-card scene-card-dictionary"
          role="button" tabindex="0" data-scene="${scene.id}"
          aria-label="打开場面辞典：${escapeHTML(scene.jp)}，${words.length} 个词"
          style="--scene:${scene.color};--scene-soft:${scene.soft}">
          <div class="scene-top">
            <span class="scene-num">${String(index + 1).padStart(2, '0')}</span>
            <span class="scene-icon">${icon(scene.icon || 'world')}</span>
          </div>
          <div class="scene-title">
            <h3 lang="ja">${escapeHTML(scene.jp)}</h3>
            <p>${escapeHTML(scene.kana)} · ${escapeHTML(scene.zh)}</p>
          </div>
          <p class="scene-desc-ja" lang="ja">${escapeHTML(scene.desc)}</p>
          <div class="word-preview">${preview}${words.length > 3 ? `<span>+${words.length - 3}</span>` : ''}</div>
          <div class="scene-foot">
            <span class="scene-count"><strong>${words.length.toLocaleString('ja-JP')}</strong> 語</span>
            <span class="scene-mini-track"><i style="width:${percent}%"></i></span>
            <span class="scene-open">引く ${icon('arrow')}</span>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderFilterChips() {
    const sceneFilters = $('#sceneFilters');
    const levelWords = wordsByLevel[state.level] || [];
    const counts = new Map();
    levelWords.forEach((word) => {
      counts.set(word.sceneGroup, (counts.get(word.sceneGroup) || 0) + 1);
    });
    const valid = new Set(dictionarySceneGroups.filter((scene) => counts.get(scene.id)));
    if (state.sceneFilter !== 'all' && !valid.has(state.sceneFilter)) {
      state.sceneFilter = 'all';
    }
    sceneFilters.innerHTML = [
      `<button type="button" class="filter-chip${state.sceneFilter === 'all' ? ' is-active' : ''}" data-scene="all" aria-pressed="${state.sceneFilter === 'all'}">全部場面</button>`,
      ...dictionarySceneGroups
        .filter((scene) => counts.get(scene.id))
        .map(
          (scene) =>
            `<button type="button" class="filter-chip${state.sceneFilter === scene.id ? ' is-active' : ''}" data-scene="${scene.id}" aria-pressed="${state.sceneFilter === scene.id}">${escapeHTML(scene.jp)} <span>${counts.get(scene.id)}</span></button>`
        )
    ].join('');

    $$('#statusToggle button').forEach((button) => {
      const active = button.dataset.status === state.statusFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderSectionFilter() {
    const wrap = $('#sectionFilterWrap');
    const select = $('#sectionFilter');
    if (!wrap || !select) return;

    const chapterScenes = scenesForLevel().filter((scene) => {
      if (!(scene.sections || []).length) return false;
      return state.sceneFilter === 'all' || sceneGroupFor({ scene: scene.id }) === state.sceneFilter;
    });
    if (!chapterScenes.length) {
      state.sectionFilter = 'all';
      wrap.hidden = true;
      select.innerHTML = '';
      return;
    }

    wrap.hidden = false;
    $('#sectionFilterLabel').textContent = `${state.level} 小节`;
    select.setAttribute('aria-label', `按 ${state.level} 小节筛选`);
    const scenes = chapterScenes;
    const validSectionIds = new Set(scenes.flatMap((scene) => scene.sections || []));
    const sectionTotal = validSectionIds.size;

    if (state.sectionFilter !== 'all' && !validSectionIds.has(state.sectionFilter)) {
      state.sectionFilter = 'all';
    }

    const options = [`<option value="all">全部小节（${sectionTotal}）</option>`];
    scenes.forEach((scene) => {
      (scene.sections || []).forEach((sectionId) => {
        const section = sectionMap[sectionId];
        if (!section) return;
        options.push(
          `<option value="${section.id}">${escapeHTML(scene.zh)} · ${escapeHTML(section.zh)}</option>`
        );
      });
    });

    select.innerHTML = options.join('');
    select.value = state.sectionFilter;
  }

  function getWordStatus(word) {
    if (state.learned.has(word.id)) return 'mastered';
    if (state.wrong.has(word.id)) return 'unmastered';
    return 'unlearned';
  }

  function renderLibrary(resetPaging = false) {
    if (resetPaging) state.visibleCount = LIBRARY_PAGE_SIZE;

    const words = wordsByLevel[state.level];
    const query = normalizeSearch(state.query);

    const filtered = words.filter((word) => {
      const section = sectionMap[word.section];
      const scene = sceneMap[word.scene];
      const sceneGroup = dictionarySceneMap[word.sceneGroup];
      if (state.sceneFilter !== 'all' && word.sceneGroup !== state.sceneFilter) return false;
      if (state.sectionFilter !== 'all' && word.section !== state.sectionFilter) return false;
      if (state.statusFilter !== 'all') {
        const status = getWordStatus(word);
        if (state.statusFilter === 'learned' && status !== 'mastered') return false;
        if (state.statusFilter === 'unmastered' && status !== 'unmastered') return false;
        if (state.statusFilter === 'unlearned' && status !== 'unlearned') return false;
      }

      if (!query) return true;

      const haystack = normalizeSearch(
        [
          word.word,
          word.reading,
          word.meaning,
          word.definitionJa,
          word.pos,
          word.example,
          word.exampleZh,
          section?.jp,
          section?.zh,
          scene?.jp,
          scene?.zh,
          sceneGroup?.jp,
          sceneGroup?.zh,
          sceneGroup?.kana
        ].join(' ')
      );
      return haystack.includes(query);
    });

    const filterIsActive =
      Boolean(query) ||
      state.sceneFilter !== 'all' ||
      state.sectionFilter !== 'all' ||
      state.statusFilter !== 'all';
    const shown = filtered.slice(0, state.visibleCount);
    const remaining = filtered.length - shown.length;

    $('#resultCount').textContent = filterIsActive
      ? `${state.level} · ${filtered.length} / ${words.length} 个单词`
      : `${state.level} · ${words.length} 个单词`;

    $('#wordList').innerHTML = shown.map(wordCardHTML).join('');
    $('#wordList').hidden = filtered.length === 0;
    $('#emptyState').hidden = filtered.length !== 0;
    $('#loadMoreWrap').hidden = remaining <= 0;
    $('#loadMoreCount').textContent = remaining > 0
      ? `（剩余 ${remaining} 个）`
      : '';

    $$('#sceneFilters .filter-chip').forEach((button) => {
      const active = button.dataset.scene === state.sceneFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $$('#statusToggle button').forEach((button) => {
      const active = button.dataset.status === state.statusFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function wordCardHTML(word) {
    const learned = state.learned.has(word.id);
    const status = getWordStatus(word);
    const statusLabel = status === 'mastered' ? '已掌握' : status === 'unmastered' ? '未掌握' : '未学习';
    const showReading = word.reading !== word.word;
    const section = sectionMap[word.section];
    const meta = word.pos || section?.zh || 'N5';
    const example = word.example || '例文暂未收录';

    return `
      <div class="vocab-card is-${status}" data-word-card="${word.id}" data-word-status="${status}">
        <button class="word-audio" type="button" data-speak="${word.id}" aria-label="朗读 ${escapeHTML(word.word)}">
          ${icon('speaker')}
        </button>
        <div class="word-info">
          <div class="word-line">
            <span class="word-jp" lang="ja">${escapeHTML(word.word)}</span>
            ${showReading ? `<span class="word-read" lang="ja">${escapeHTML(word.reading)}</span>` : ''}
            <span class="word-status is-${status}">${statusLabel}</span>
          </div>
          <div class="word-example-row">
            <p class="word-example-line" lang="ja">${escapeHTML(example)}</p>
            ${word.example ? `
              <button class="example-audio" type="button" data-example-speak="${word.id}"
                aria-label="朗读 ${escapeHTML(word.word)} 的例句" title="朗读例句">
                ${icon('speaker')}
              </button>
            ` : ''}
          </div>
        </div>
        <div class="word-side">
          <p class="word-definition" lang="ja">${escapeHTML(word.definitionJa)}</p>
          <small>中文：${escapeHTML(word.meaning)} · ${escapeHTML(meta)}</small>
        </div>
        <button class="learn-dot" type="button" data-learn="${word.id}"
          aria-pressed="${learned}" aria-label="${learned ? '取消已掌握' : status === 'unmastered' ? '标记为已掌握（当前未掌握）' : '标记为已掌握'}：${escapeHTML(word.word)}"
          title="${learned ? '取消已掌握' : '标记为已掌握'}">
          ${icon('check')}
        </button>
      </div>
    `;
  }

  function renderHero() {
    const latest = [...state.archive.texts].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    )[0];
    const button = $('#heroReadingBtn');
    if (!button) return;

    updateArchiveStats();
    if (latest) {
      const excerpt = latest.content.replace(/\s+/g, ' ').trim().slice(0, 90);
      $('#heroReadingDate').textContent = archiveDateLabel(latest.createdAt);
      $('#heroReadingTitle').textContent = latest.title;
      $('#heroReadingExcerpt').textContent = excerpt || '打开这段阅读，点击其中的日语词。';
      $('#heroReadingMeta').textContent = `${archiveFolderName(latest.folderId)} · ${Array.from(latest.content).length} 字 · 点词可归类`;
      button.textContent = '继续阅读';
      button.dataset.textId = latest.id;
      $('#heroArchiveBtn').hidden = false;
    } else {
      $('#heroReadingDate').textContent = '—';
      $('#heroReadingTitle').textContent = '把一段日语放进来';
      $('#heroReadingExcerpt').textContent = '文章、对话、新闻，都可以成为今天的阅读。';
      $('#heroReadingMeta').textContent = '归档后，这里会出现你最近读的一段。';
      button.textContent = '归档一段日语';
      button.dataset.textId = '';
      $('#heroArchiveBtn').hidden = true;
    }
  }

  function updateArchiveStats() {
    const texts = $('#statTexts');
    const clicked = $('#statClicked');
    const words = $('#statWords');
    if (texts) texts.textContent = String(state.archive.texts.length);
    if (clicked) clicked.textContent = String(state.archive.clicked.size);
    if (words) words.textContent = formatCount(VOCAB.length);
  }

  function updateTodayCount() {
    $('#todayCount').textContent = String(state.daily.ids.size);
  }

  function updateQuizSummary() {
    const level = levelMap[state.level];
    const words = wordsByLevel[state.level];
    const learned = words.filter((word) => state.learned.has(word.id)).length;
    const best = state.quizBest[state.level];

    $('#quizLevelLabel').textContent = level.id;
    $('#quizMastered').textContent = `${learned} / ${words.length}`;
    $('#quizBest').textContent = Number.isFinite(best) ? `${best} / 10` : '—';
  }

  function getWrongEntries(level = 'all') {
    return [...state.wrong.entries()]
      .map(([wordId, info]) => ({
        word: wordMap.get(wordId),
        count: info.count,
        lastWrong: info.lastWrong,
        lastSource: info.lastSource || 'quiz',
        unfamiliar: info.unfamiliar || 0,
        quizWrong: info.quizWrong || 0
      }))
      .filter((entry) => entry.word && (level === 'all' || entry.word.level === level))
      .sort((a, b) => String(b.lastWrong).localeCompare(String(a.lastWrong)));
  }

  function getSelectedWrongEntries() {
    let entries = getWrongEntries(state.wrongLevel);
    if (state.wrongScene !== 'all') {
      entries = entries.filter((entry) => entry.word.scene === state.wrongScene);
    }
    return entries;
  }

  function updateWrongSummary() {
    const total = state.wrong.size;
    $('#wrongCount').textContent = String(total);
    $('#navWrongCount').textContent = String(total);
    $('#mobileWrongCount').textContent = String(total);
  }

  function getMasteredEntries(level = 'all') {
    return [...state.learned]
      .map((wordId) => wordMap.get(wordId))
      .filter((word) => word && (level === 'all' || word.level === level))
      .sort((a, b) => (wordOrder.get(a.id) ?? 0) - (wordOrder.get(b.id) ?? 0));
  }

  function getSelectedMasteredEntries() {
    let entries = getMasteredEntries(state.masteredLevel);
    if (state.masteredScene !== 'all') {
      entries = entries.filter((word) => word.scene === state.masteredScene);
    }
    return entries;
  }

  function updateMasteredSummary() {
    const total = state.learned.size;
    $('#masteredCount').textContent = String(total);
    $('#navMasteredCount').textContent = String(total);
    $('#mobileMasteredCount').textContent = String(total);
  }

  function addWrong(wordId, source = 'quiz') {
    if (!wordMap.has(wordId)) return;
    const existing = state.wrong.get(wordId);
    state.wrong.set(wordId, {
      count: (existing?.count || 0) + 1,
      lastWrong: new Date().toISOString(),
      lastSource: source === 'unfamiliar' ? 'unfamiliar' : 'quiz',
      unfamiliar: (existing?.unfamiliar || 0) + (source === 'unfamiliar' ? 1 : 0),
      quizWrong: (existing?.quizWrong || 0) + (source === 'unfamiliar' ? 0 : 1)
    });
    persist();
    updateWrongSummary();
    renderLibrary(false);
  }

  function removeWrong(wordId) {
    if (!state.wrong.delete(wordId)) return;
    persist();
    updateWrongSummary();
    renderLibrary(false);
  }

  /* ── Learning state ────────────────────────────────────── */

  function setLevel(levelId) {
    if (!levelMap[levelId] || state.level === levelId) return;
    const shouldRestoreFocus = Boolean(document.activeElement?.closest('[data-level]'));
    state.level = levelId;
    const nextScenes = scenesForLevel(levelId);
    if (state.sceneFilter !== 'all' && !nextScenes.some((scene) => scene.id === state.sceneFilter)) {
      state.sceneFilter = 'all';
    }
    state.sectionFilter = 'all';
    persist();
    $('#activeLevelBadge').textContent = `${levelId} · ${levelMap[levelId].jp}`;
    renderLevels();
    renderScenes();
    renderFilterChips();
    renderSectionFilter();
    renderLibrary(true);
    renderHero();
    updateQuizSummary();
    if (shouldRestoreFocus) {
      $(`.level-card[data-level="${levelId}"]`)?.focus({ preventScroll: true });
    }
    showToast(`已切换到 ${levelId} · ${levelMap[levelId].zh}`);
  }

  function setLearned(wordId, value, options = {}) {
    rolloverDay();
    const word = wordMap.get(wordId);
    if (!word) return;
    const focusedLearnButton = document.activeElement?.dataset?.learn || null;

    const wasLearned = state.learned.has(wordId);
    const wasWrong = state.wrong.has(wordId);
    if (wasLearned === value) {
      if (value && wasWrong) {
        state.wrong.delete(wordId);
        persist();
        updateWrongSummary();
      }
      return;
    }

    if (value) {
      state.learned.add(wordId);
      state.daily.ids.add(wordId);
      if (wasWrong) state.wrong.delete(wordId);
    } else {
      state.learned.delete(wordId);
    }

    persist();
    renderLevels();
    renderScenes();
    renderLibrary(false);
    renderHero();
    updateQuizSummary();
    updateTodayCount();
    updateWrongSummary();
    updateMasteredSummary();

    if (focusedLearnButton) {
      const restoredButton = $(`[data-learn="${focusedLearnButton}"]`);
      (restoredButton || $('#statusToggle button.is-active'))?.focus({ preventScroll: true });
    }

    if (!options.silent) {
      showToast(
        value ? `已记住「${word.word}」· ${word.meaning}` : `已取消「${word.word}」的掌握标记`
      );
    }
  }

  /* ── Study cards ───────────────────────────────────────── */

  function openStudyScene(sceneId) {
    const scene = sceneMap[sceneId];
    const words = wordsByLevel[state.level].filter((word) => word.scene === sceneId);
    if (!scene || !words.length) return;
    const scenes = scenesForLevel();
    const sceneIndex = scenes.findIndex((item) => item.id === sceneId);
    const scopes = (scene.sections || [])
      .map((sectionId) => sectionMap[sectionId])
      .filter(Boolean)
      .map((section) => ({
        ...section,
        count: words.filter((word) => word.section === section.id).length
      }))
      .filter((section) => section.count > 0);
    const isChapter = scopes.length > 0;

    openStudy(
      words,
      {
        kicker: `${state.level} · ${isChapter ? 'CHAPTER' : 'SCENE'} ${String(sceneIndex + 1).padStart(2, '0')}`,
        title: scene.jp,
        subtitle: isChapter
          ? `${scene.zh} · ${scopes.length} 个小节 · ${words.length} 个词`
          : `${scene.zh} · ${scene.desc}`,
        sceneId
      },
      { scopes }
    );
  }

  function openReview() {
    const words = shuffle(wordsByLevel[state.level]).slice(0, 10);
    openStudy(words, {
      kicker: `${state.level} · RANDOM REVIEW`,
      title: '随机复习',
      subtitle: `从当前等级抽出的 ${words.length} 个单词`
    });
  }

  function openRandomWord() {
    const words = wordsByLevel[state.level];
    const word = words[Math.floor(Math.random() * words.length)];
    const scene = sceneMap[word.scene];
    openStudy([word], {
      kicker: `${state.level} · TODAY'S WORD`,
      title: word.word,
      subtitle: `${scene.zh} · 随机抽到的一个词`
    });
  }

  function openStudy(words, meta, options = {}) {
    state.study = {
      allWords: words,
      words,
      scopes: options.scopes || [],
      scope: 'all',
      index: 0,
      meta
    };

    $('#studyKicker').textContent = meta.kicker;
    $('#studyTitle').textContent = meta.title;
    $('#studySubtitle').textContent = meta.subtitle;
    $('#studyBody').hidden = false;
    $('#studyComplete').hidden = true;

    renderStudy();
    openModal($('#studyModal'));
  }

  function renderStudyScopes() {
    const study = state.study;
    const wrap = $('#studyScopes');
    if (!study || !study.scopes.length) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }

    wrap.hidden = false;
    wrap.innerHTML = [
      `<button type="button" class="study-scope${study.scope === 'all' ? ' is-active' : ''}" data-scope="all" aria-pressed="${study.scope === 'all'}">全部 <span>${study.allWords.length}</span></button>`,
      ...study.scopes.map(
        (section) =>
          `<button type="button" class="study-scope${study.scope === section.id ? ' is-active' : ''}" data-scope="${section.id}" aria-pressed="${study.scope === section.id}">${escapeHTML(section.jp)} <span>${section.count}</span></button>`
      )
    ].join('');
  }

  function setStudyScope(scope) {
    const study = state.study;
    if (!study) return;
    const nextWords = scope === 'all'
      ? study.allWords
      : study.allWords.filter((word) => word.section === scope);
    if (!nextWords.length) return;
    study.scope = scope;
    study.words = nextWords;
    study.index = 0;
    renderStudy();
    $(`#studyScopes [data-scope="${scope}"]`)?.focus({ preventScroll: true });
  }

  function renderStudy() {
    const study = state.study;
    if (!study || !study.words.length) return;

    const word = study.words[study.index];
    const section = sectionMap[word.section];
    const learnedCount = study.words.filter((item) => state.learned.has(item.id)).length;
    const percent = ((study.index + 1) / study.words.length) * 100;

    renderStudyScopes();
    $('#studyCount').textContent = `${study.index + 1} / ${study.words.length}`;
    $('#studyLearnedCount').textContent = `${learnedCount} 已掌握`;
    $('#studyBar').style.width = `${percent}%`;

    $('#fcPos').textContent = word.pos || section?.jp || word.level;
    $('#fcWord').textContent = word.word;
    setLongClass($('#fcWord'), word.word);
    $('#fcReading').textContent = word.reading;
    $('#fcReading').hidden = word.reading === word.word;
    $('#fcLevel').textContent = word.level;
    $('#fcAudio').setAttribute('aria-label', `朗读 ${word.word}`);
    $('#fcMeaning').textContent = word.definitionJa;
    if ($('#fcMeaningZh')) $('#fcMeaningZh').textContent = `中文：${word.meaning}`;
    $('#fcExample').textContent = word.example || '';
    $('#fcExampleZh').textContent = word.exampleZh || '';
    $('#fcExample').closest('.fc-example').hidden = !word.example;
    $('#fcExampleAudio').hidden = !word.example;
    $('#fcExampleAudio').setAttribute('aria-label', `朗读 ${word.word} 的例句`);

    $('#fcAnswer').hidden = true;
    $('#revealBtn').hidden = false;
    $('#revealBtn').setAttribute('aria-expanded', 'false');
    $('#flashcard').classList.remove('is-revealed');

    const alreadyLearned = state.learned.has(word.id);
    $('#markLearnedBtn').innerHTML = alreadyLearned
      ? '已掌握 <span aria-hidden="true">✓</span>'
      : '记住了 <span aria-hidden="true">✓</span>';

    $('#prevCard').disabled = study.words.length <= 1;
    $('#nextCard').disabled = study.words.length <= 1;
  }

  function revealStudyAnswer() {
    if (!state.study || $('#studyBody').hidden) return;
    $('#fcAnswer').hidden = false;
    $('#revealBtn').hidden = true;
    $('#revealBtn').setAttribute('aria-expanded', 'true');
    $('#flashcard').classList.add('is-revealed');
  }

  function moveStudy(step) {
    if (!state.study) return;
    const total = state.study.words.length;
    state.study.index = (state.study.index + step + total) % total;
    renderStudy();
  }

  function finishStudyRound() {
    const study = state.study;
    if (!study) return;
    const learnedCount = study.words.filter((word) => state.learned.has(word.id)).length;
    const complete = $('#studyComplete');
    const heading = complete.querySelector('h3');

    $('#studyBody').hidden = true;
    complete.hidden = false;

    heading.textContent = learnedCount === study.words.length ? '这一轮，收好了。' : '这一轮，过完了。';
    if (learnedCount === 0) {
      $('#completeText').textContent = '慢慢来。下次再见到它们时，你会更眼熟一点。';
    } else if (learnedCount === study.words.length) {
      $('#completeText').textContent = `这一轮的 ${study.words.length} 个词，已经全部收进你的词汇林。`;
    } else {
      $('#completeText').textContent = `这一轮的 ${study.words.length} 个词里，有 ${learnedCount} 个已经收进词汇林。`;
    }

    $('#restartRound').focus({ preventScroll: true });
  }

  function markCurrentWord(value) {
    const study = state.study;
    if (!study) return;
    const word = study.words[study.index];
    const wasLearned = state.learned.has(word.id);
    const wasWrong = state.wrong.has(word.id);

    setLearned(word.id, value, { silent: true });

    if (!value) {
      addWrong(word.id, 'unfamiliar');
      showToast(`已加入错词集：「${word.word}」`);
    } else if (wasWrong) {
      showToast(`已加入已掌握，并从错词集移出：「${word.word}」`);
    } else if (!wasLearned) {
      showToast(`已加入已掌握：「${word.word}」`);
    }

    if (study.index >= study.words.length - 1) {
      finishStudyRound();
      return;
    }

    study.index += 1;
    renderStudy();
  }

  function restartStudyRound() {
    if (!state.study) return;
    state.study.index = 0;
    $('#studyComplete').hidden = true;
    $('#studyBody').hidden = false;
    renderStudy();
    $('#revealBtn').focus({ preventScroll: true });
  }

  /* ── Quiz ──────────────────────────────────────────────── */

  function makeQuestion(word, pool, index) {
    const kind = index % 3 === 2 ? 'word' : 'meaning';
    const distractorPool = uniqueBy(
      pool.filter((item) => {
        if (item.id === word.id) return false;
        return kind === 'meaning' ? item.meaning !== word.meaning : item.word !== word.word;
      }),
      kind === 'meaning' ? 'meaning' : 'word'
    );
    const distractors = shuffle(distractorPool).slice(0, 3);
    const choices = shuffle([word, ...distractors]);

    return {
      word,
      kind,
      prompt: kind === 'meaning' ? '这个单词是什么意思？' : '选出对应的日语单词',
      display: kind === 'meaning' ? word.word : word.meaning,
      sub: kind === 'meaning'
        ? (word.reading === word.word ? '选择最接近的中文释义' : word.reading)
        : '从下面四个选项中选出正确的一项',
      correctText: kind === 'meaning' ? word.meaning : word.word,
      options: choices.map((choice) => ({
        text: kind === 'meaning' ? choice.meaning : choice.word,
        correct: choice.id === word.id
      }))
    };
  }

  function buildQuestions(levelId) {
    const pool = wordsByLevel[levelId];
    const selected = shuffle(pool).slice(0, Math.min(10, pool.length));
    return selected.map((word, index) => makeQuestion(word, pool, index));
  }

  function buildQuestionsForWords(words) {
    return words.map((word, index) =>
      makeQuestion(word, wordsByLevel[word.level] || VOCAB, index)
    );
  }

  function startQuiz() {
    const levelId = state.level;
    const questions = buildQuestions(levelId);
    if (!questions.length) return;

    state.quiz = {
      level: levelId,
      questions,
      index: 0,
      score: 0,
      answered: false,
      mode: 'normal'
    };

    $('#quizTitle').textContent = '词汇小测';
    $('#quizKicker').textContent = `${levelId} · ${questions.length} ${questions.length === 1 ? 'QUESTION' : 'QUESTIONS'}`;
    $('#quizStage').hidden = false;
    $('#quizResult').hidden = true;
    renderQuiz();
    openModal($('#quizModal'));
  }

  function startWrongQuiz() {
    const entries = getSelectedWrongEntries();
    if (!entries.length) {
      showToast('错词集还是空的，先去做一次小测吧');
      return;
    }

    const words = shuffle(entries.map((entry) => entry.word)).slice(0, 10);
    const questions = buildQuestionsForWords(words);
    state.quiz = {
      level: '错词集',
      questions,
      index: 0,
      score: 0,
      answered: false,
      mode: 'wrong'
    };

    $('#quizTitle').textContent = '错词重练';
    $('#quizKicker').textContent = `错词重练 · ${questions.length} ${questions.length === 1 ? 'QUESTION' : 'QUESTIONS'}`;
    $('#quizStage').hidden = false;
    $('#quizResult').hidden = true;
    renderQuiz();
    openModal($('#quizModal'));
  }

  function renderQuiz() {
    const quiz = state.quiz;
    if (!quiz) return;
    const question = quiz.questions[quiz.index];
    const total = quiz.questions.length;

    $('#quizProgressText').textContent = `第 ${quiz.index + 1} / ${total} 题`;
    $('#quizScoreText').textContent = `${quiz.score} 分`;
    $('#quizBar').style.width = `${((quiz.index + 1) / total) * 100}%`;

    $('#quizQuestionLabel').textContent = question.prompt;
    $('#quizWord').textContent = question.display;
    $('#quizWord').lang = question.kind === 'meaning' ? 'ja' : 'zh-CN';
    setLongClass($('#quizWord'), question.display);
    $('#quizReading').textContent = question.sub;
    $('#quizReading').lang = question.kind === 'meaning' ? 'ja' : 'zh-CN';
    $('#quizAudioBtn').hidden = question.kind !== 'meaning';
    $('#quizAudioBtn').setAttribute('aria-label', `朗读 ${question.word.word}`);

    $('#quizOptions').innerHTML = question.options
      .map(
        (option, index) => `
          <button class="quiz-option" type="button" data-option="${index}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span lang="${question.kind === 'meaning' ? 'zh-CN' : 'ja'}">${escapeHTML(option.text)}</span>
          </button>
        `
      )
      .join('');

    quiz.answered = false;
    $('#quizFeedback').hidden = true;
    $('#quizFeedback').classList.remove('is-wrong');
    $('#quizDontKnowBtn').hidden = false;
    $('#quizDontKnowBtn').disabled = false;
    $('#nextQuestion').textContent = quiz.index === total - 1 ? '查看结果' : '下一题';
  }

  function answerQuiz(optionIndex, { dontKnow = false } = {}) {
    const quiz = state.quiz;
    if (!quiz || quiz.answered) return;
    const question = quiz.questions[quiz.index];
    const selected = dontKnow ? null : question.options[optionIndex];
    if (!dontKnow && !selected) return;

    const isCorrect = Boolean(selected?.correct);
    quiz.answered = true;
    if (isCorrect) quiz.score += 1;

    const buttons = $$('#quizOptions .quiz-option');
    buttons.forEach((button, index) => {
      button.disabled = true;
      if (question.options[index].correct) button.classList.add('is-correct');
      if (!dontKnow && index === optionIndex && !isCorrect) button.classList.add('is-wrong');
    });

    if (isCorrect) {
      if (quiz.mode === 'wrong') removeWrong(question.word.id);
    } else {
      addWrong(question.word.id, 'quiz');
    }

    const feedback = $('#quizFeedback');
    feedback.hidden = false;
    feedback.classList.toggle('is-wrong', !isCorrect);
    $('#feedbackIcon').textContent = isCorrect ? '✓' : '×';

    if (isCorrect) {
      $('#feedbackTitle').textContent = quiz.mode === 'wrong' ? '答对了，已移出错词集' : '答对了';
    } else if (dontKnow) {
      $('#feedbackTitle').textContent = '已加入错词集';
    } else {
      $('#feedbackTitle').textContent = '差一点，已加入错词集';
    }

    const word = question.word;
    if (isCorrect) {
      $('#feedbackText').textContent =
        `「${question.display}」— ${question.correctText}` +
        (quiz.mode === 'wrong' ? '。已从错词集移除。' : '');
    } else {
      $('#feedbackText').textContent =
        `正确答案是「${question.correctText}」。${word.word}（${word.reading}）＝ ${word.meaning}。已加入错词集。`;
    }

    $('#quizScoreText').textContent = `${quiz.score} 分`;
    $('#quizDontKnowBtn').hidden = true;
    $('#nextQuestion').focus({ preventScroll: true });
  }

  function nextQuizQuestion() {
    const quiz = state.quiz;
    if (!quiz) return;

    if (quiz.index < quiz.questions.length - 1) {
      quiz.index += 1;
      renderQuiz();
      $('#quizOptions .quiz-option')?.focus({ preventScroll: true });
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const quiz = state.quiz;
    if (!quiz) return;
    const total = quiz.questions.length;
    const percent = Math.round((quiz.score / total) * 100);
    const isWrongMode = quiz.mode === 'wrong';

    $('#quizStage').hidden = true;
    $('#quizResult').hidden = false;
    $('#resultScore').textContent = String(quiz.score);
    $('#resultRing').style.setProperty('--score', String(percent));

    if (isWrongMode) {
      if (quiz.score === total) {
        $('#resultTitle').textContent = '错词清掉了。';
      } else if (quiz.score >= total * 0.6) {
        $('#resultTitle').textContent = '不错，再巩固一下。';
      } else {
        $('#resultTitle').textContent = '再看一遍，就会了。';
      }
      const remaining = state.wrong.size;
      const remainingInFilter = getSelectedWrongEntries().length;
      $('#resultText').textContent =
        `答对 ${quiz.score} / ${total} 题 · 错词重练` +
        (remaining ? ` · 错词集还有 ${remaining} 个` : ' · 错词集已清空');
      $('#retryQuiz').textContent = remainingInFilter ? '再练错词' : '做普通小测';
    } else {
      if (quiz.score === total) {
        $('#resultTitle').textContent = '全部答对，漂亮。';
      } else if (quiz.score >= total * 0.8) {
        $('#resultTitle').textContent = '很稳，再走一轮。';
      } else if (quiz.score >= total * 0.6) {
        $('#resultTitle').textContent = '基础不错，再巩固一下。';
      } else {
        $('#resultTitle').textContent = '没关系，回场景里再看看。';
      }
      $('#resultText').textContent = `答对 ${quiz.score} / ${total} 题 · ${quiz.level} 词汇`;
      $('#retryQuiz').textContent = '再来一次';
    }

    if (!isWrongMode) {
      const previousBest = Number.isFinite(state.quizBest[quiz.level]) ? state.quizBest[quiz.level] : -1;
      if (quiz.score > previousBest) {
        state.quizBest[quiz.level] = quiz.score;
        persist();
        updateQuizSummary();
        if (quiz.score >= 8) {
          showToast(`新的最佳成绩 · ${quiz.level} ${quiz.score} / ${total}`);
        }
      }
    }

    $('#retryQuiz').focus({ preventScroll: true });
  }

  /* ── Wrong-answer book ─────────────────────────────────── */

  function wrongDateLabel(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    if (todayKey(date) === todayKey()) return '今天';
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }

  function wrongItemHTML(entry) {
    const word = entry.word;
    const scene = sceneMap[word.scene];
    const section = sectionMap[word.section];
    const sourceLabel = entry.lastSource === 'unfamiliar' ? '还不熟' : '测验答错';
    const meta = [word.level, scene?.zh, section?.zh, sourceLabel].filter(Boolean).join(' · ');
    const reading = word.reading !== word.word
      ? `<span class="wrong-read" lang="ja">${escapeHTML(word.reading)}</span>`
      : '';

    return `
      <div class="wrong-item" data-wrong-item="${word.id}">
        <button class="word-audio" type="button" data-wrong-audio="${word.id}" aria-label="朗读 ${escapeHTML(word.word)}">
          ${icon('speaker')}
        </button>
        <div class="wrong-info">
          <div class="wrong-line">
            <span class="wrong-word" lang="ja">${escapeHTML(word.word)}</span>
            ${reading}
          </div>
          <p class="wrong-meaning">${escapeHTML(word.meaning)}</p>
          <p class="wrong-meta">${escapeHTML(meta)}</p>
        </div>
        <div class="wrong-stats">
          <span>错 ${entry.count} 次</span>
          <small>${wrongDateLabel(entry.lastWrong)}</small>
        </div>
        <button class="wrong-remove" type="button" data-wrong-remove="${word.id}"
          aria-label="移出错词集：${escapeHTML(word.word)}" title="移出错词集">
          ${icon('close')}
        </button>
      </div>
    `;
  }

  function renderWrongBook() {
    const allEntries = getWrongEntries();
    const counts = Object.fromEntries(
      LEVELS.map((level) => [
        level.id,
        allEntries.filter((entry) => entry.word.level === level.id).length
      ])
    );

    if (state.wrongLevel !== 'all' && !counts[state.wrongLevel]) {
      state.wrongLevel = 'all';
    }

    const levelEntries = getWrongEntries(state.wrongLevel);
    const sceneCounts = new Map();
    levelEntries.forEach((entry) => {
      sceneCounts.set(entry.word.scene, (sceneCounts.get(entry.word.scene) || 0) + 1);
    });

    const sceneOptions = [
      `<option value="all">全部场景（${levelEntries.length}）</option>`
    ];
    LEVELS.forEach((level) => {
      if (state.wrongLevel !== 'all' && state.wrongLevel !== level.id) return;
      scenesForLevel(level.id).forEach((scene) => {
        const count = sceneCounts.get(scene.id) || 0;
        if (!count) return;
        const prefix = state.wrongLevel === 'all' ? `${level.id} · ` : '';
        sceneOptions.push(
          `<option value="${scene.id}">${prefix}${escapeHTML(scene.zh)}（${count}）</option>`
        );
      });
    });

    const validSceneIds = new Set(sceneCounts.keys());
    if (state.wrongScene !== 'all' && !validSceneIds.has(state.wrongScene)) {
      state.wrongScene = 'all';
    }

    const sceneSelect = $('#wrongSceneFilter');
    sceneSelect.innerHTML = sceneOptions.join('');
    sceneSelect.value = state.wrongScene;
    sceneSelect.disabled = levelEntries.length === 0;
    $('#wrongSceneFilterWrap').hidden = levelEntries.length === 0;

    $('#wrongLevelFilters').innerHTML = [
      `<button type="button" class="wrongbook-level${state.wrongLevel === 'all' ? ' is-active' : ''}" data-wrong-level="all" aria-pressed="${state.wrongLevel === 'all'}">全部 <span>${allEntries.length}</span></button>`,
      ...LEVELS.map(
        (level) =>
          `<button type="button" class="wrongbook-level${state.wrongLevel === level.id ? ' is-active' : ''}" data-wrong-level="${level.id}" aria-pressed="${state.wrongLevel === level.id}">${level.id} <span>${counts[level.id]}</span></button>`
      )
    ].join('');

    const entries = getSelectedWrongEntries();
    const levelOrder = new Map(LEVELS.map((level, index) => [level.id, index]));
    const sceneOrder = new Map();
    LEVELS.forEach((level) => {
      scenesForLevel(level.id).forEach((scene, index) => sceneOrder.set(scene.id, index));
    });
    entries.sort((a, b) => {
      const levelDifference = (levelOrder.get(a.word.level) ?? 99) - (levelOrder.get(b.word.level) ?? 99);
      if (levelDifference) return levelDifference;
      const sceneDifference = (sceneOrder.get(a.word.scene) ?? 99) - (sceneOrder.get(b.word.scene) ?? 99);
      if (sceneDifference) return sceneDifference;
      return String(b.lastWrong).localeCompare(String(a.lastWrong));
    });

    const groups = new Map();
    entries.forEach((entry) => {
      const key = `${entry.word.level}:${entry.word.scene}`;
      if (!groups.has(key)) {
        groups.set(key, {
          level: entry.word.level,
          scene: sceneMap[entry.word.scene],
          items: []
        });
      }
      groups.get(key).items.push(entry);
    });

    $('#wrongSummary').textContent = state.wrongLevel === 'all' && state.wrongScene === 'all'
      ? `${entries.length} 个待复习`
      : `${entries.length} 个待复习 · 共 ${allEntries.length} 个`;
    $('#wrongList').innerHTML = [...groups.values()]
      .map(
        (group) => `
          <div class="wrong-group">
            <div class="wrong-group-head">
              <span class="wrong-group-level">${group.level}</span>
              <span>${escapeHTML(group.scene?.zh || '未分类')}</span>
              <small>${group.items.length} 词</small>
            </div>
            ${group.items.map(wrongItemHTML).join('')}
          </div>
        `
      )
      .join('');
    $('#wrongList').hidden = entries.length === 0;
    $('#wrongEmpty').hidden = entries.length !== 0;
    $('#retryWrongBtn').disabled = entries.length === 0;
    $('#retryWrongBtn').textContent = entries.length
      ? `重练 ${Math.min(10, entries.length)} 个错词`
      : '暂无可重练';
    $('#clearWrongBtn').disabled = allEntries.length === 0;
  }

  function openWrongBook() {
    state.wrongLevel = 'all';
    state.wrongScene = 'all';
    renderWrongBook();
    openModal($('#wrongModal'));
  }

  function clearWrongBook() {
    if (!state.wrong.size) return;
    if (!window.confirm('确定清空全部错词记录吗？')) return;
    state.wrong.clear();
    persist();
    updateWrongSummary();
    renderWrongBook();
    renderLibrary(false);
  }

  /* ── Mastered words ───────────────────────────────────── */

  function masteredItemHTML(word) {
    const scene = sceneMap[word.scene];
    const section = sectionMap[word.section];
    const meta = [word.level, scene?.zh, section?.zh].filter(Boolean).join(' · ');
    const reading = word.reading !== word.word
      ? `<span class="wrong-read" lang="ja">${escapeHTML(word.reading)}</span>`
      : '';

    return `
      <div class="wrong-item" data-mastered-item="${word.id}">
        <button class="word-audio" type="button" data-mastered-audio="${word.id}" aria-label="朗读 ${escapeHTML(word.word)}">
          ${icon('speaker')}
        </button>
        <div class="wrong-info">
          <div class="wrong-line">
            <span class="wrong-word" lang="ja">${escapeHTML(word.word)}</span>
            ${reading}
          </div>
          <p class="wrong-meaning">${escapeHTML(word.meaning)}</p>
          <p class="wrong-meta">${escapeHTML(meta)}</p>
        </div>
        <div class="wrong-stats">
          <span class="mastered-tag">已掌握</span>
        </div>
        <button class="wrong-remove" type="button" data-mastered-remove="${word.id}"
          aria-label="取消已掌握：${escapeHTML(word.word)}" title="取消已掌握">
          ${icon('close')}
        </button>
      </div>
    `;
  }

  function renderMasteredBook() {
    const allEntries = getMasteredEntries();
    const counts = Object.fromEntries(
      LEVELS.map((level) => [
        level.id,
        allEntries.filter((word) => word.level === level.id).length
      ])
    );

    if (state.masteredLevel !== 'all' && !counts[state.masteredLevel]) {
      state.masteredLevel = 'all';
    }

    const levelEntries = getMasteredEntries(state.masteredLevel);
    const sceneCounts = new Map();
    levelEntries.forEach((word) => {
      sceneCounts.set(word.scene, (sceneCounts.get(word.scene) || 0) + 1);
    });

    const sceneOptions = [
      `<option value="all">全部场景（${levelEntries.length}）</option>`
    ];
    LEVELS.forEach((level) => {
      if (state.masteredLevel !== 'all' && state.masteredLevel !== level.id) return;
      scenesForLevel(level.id).forEach((scene) => {
        const count = sceneCounts.get(scene.id) || 0;
        if (!count) return;
        const prefix = state.masteredLevel === 'all' ? `${level.id} · ` : '';
        sceneOptions.push(
          `<option value="${scene.id}">${prefix}${escapeHTML(scene.zh)}（${count}）</option>`
        );
      });
    });

    const validSceneIds = new Set(sceneCounts.keys());
    if (state.masteredScene !== 'all' && !validSceneIds.has(state.masteredScene)) {
      state.masteredScene = 'all';
    }

    const sceneSelect = $('#masteredSceneFilter');
    sceneSelect.innerHTML = sceneOptions.join('');
    sceneSelect.value = state.masteredScene;
    sceneSelect.disabled = levelEntries.length === 0;
    $('#masteredSceneFilterWrap').hidden = levelEntries.length === 0;

    $('#masteredLevelFilters').innerHTML = [
      `<button type="button" class="wrongbook-level${state.masteredLevel === 'all' ? ' is-active' : ''}" data-mastered-level="all" aria-pressed="${state.masteredLevel === 'all'}">全部 <span>${allEntries.length}</span></button>`,
      ...LEVELS.map(
        (level) =>
          `<button type="button" class="wrongbook-level${state.masteredLevel === level.id ? ' is-active' : ''}" data-mastered-level="${level.id}" aria-pressed="${state.masteredLevel === level.id}">${level.id} <span>${counts[level.id]}</span></button>`
      )
    ].join('');

    const entries = getSelectedMasteredEntries();
    const levelOrder = new Map(LEVELS.map((level, index) => [level.id, index]));
    const sceneOrder = new Map();
    LEVELS.forEach((level) => {
      scenesForLevel(level.id).forEach((scene, index) => sceneOrder.set(scene.id, index));
    });
    entries.sort((a, b) => {
      const levelDifference = (levelOrder.get(a.level) ?? 99) - (levelOrder.get(b.level) ?? 99);
      if (levelDifference) return levelDifference;
      const sceneDifference = (sceneOrder.get(a.scene) ?? 99) - (sceneOrder.get(b.scene) ?? 99);
      if (sceneDifference) return sceneDifference;
      return (wordOrder.get(a.id) ?? 0) - (wordOrder.get(b.id) ?? 0);
    });

    const groups = new Map();
    entries.forEach((word) => {
      const key = `${word.level}:${word.scene}`;
      if (!groups.has(key)) {
        groups.set(key, {
          level: word.level,
          scene: sceneMap[word.scene],
          items: []
        });
      }
      groups.get(key).items.push(word);
    });

    $('#masteredSummary').textContent = state.masteredLevel === 'all' && state.masteredScene === 'all'
      ? `${entries.length} 个已掌握`
      : `${entries.length} 个已掌握 · 共 ${allEntries.length} 个`;
    $('#masteredList').innerHTML = [...groups.values()]
      .map(
        (group) => `
          <div class="wrong-group">
            <div class="wrong-group-head">
              <span class="wrong-group-level">${group.level}</span>
              <span>${escapeHTML(group.scene?.zh || '未分类')}</span>
              <small>${group.items.length} 词</small>
            </div>
            ${group.items.map(masteredItemHTML).join('')}
          </div>
        `
      )
      .join('');
    $('#masteredList').hidden = entries.length === 0;
    $('#masteredEmpty').hidden = entries.length !== 0;
    $('#masteredReviewBtn').disabled = entries.length === 0;
    $('#masteredReviewBtn').textContent = entries.length
      ? `复习 ${Math.min(10, entries.length)} 词`
      : '暂无可复习';
  }

  function openMasteredBook() {
    state.masteredLevel = 'all';
    state.masteredScene = 'all';
    renderMasteredBook();
    openModal($('#masteredModal'));
  }

  function removeMastered(wordId) {
    const word = wordMap.get(wordId);
    if (!word || !state.learned.has(wordId)) return;
    setLearned(wordId, false, { silent: true });
    renderMasteredBook();
    showToast(`已取消已掌握：「${word.word}」`);
  }

  function startMasteredReview() {
    const entries = getSelectedMasteredEntries();
    if (!entries.length) return;
    const words = shuffle(entries).slice(0, 10);
    openStudy(words, {
      kicker: 'MASTERED · REVIEW',
      title: '掌握复习',
      subtitle: `从 ${entries.length} 个已掌握词中随机抽取 ${words.length} 个`
    });
  }

  /* ── Archive ───────────────────────────────────────────── */

  function archiveTitleFromContent(content) {
    const firstLine = String(content)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) || '';
    return firstLine.slice(0, 40) || '未命名归档';
  }

  function archiveFolderById(folderId) {
    return state.archive.folders.find((folder) => folder.id === folderId) || null;
  }

  function archiveTextById(textId) {
    return state.archive.texts.find((text) => text.id === textId) || null;
  }

  function archiveFolderName(folderId) {
    return archiveFolderById(folderId)?.name || '未分类';
  }

  function renderArchive() {
    const folderExists = state.archive.folderFilter === 'all' || Boolean(archiveFolderById(state.archive.folderFilter));
    if (!folderExists) state.archive.folderFilter = 'all';
    renderArchiveFolders();
    renderArchiveFolderSelect();
    renderArchiveTextList();
    updateClickedSummary();
    renderHero();
  }

  function renderArchiveFolders() {
    const counts = new Map();
    state.archive.texts.forEach((text) => {
      counts.set(text.folderId, (counts.get(text.folderId) || 0) + 1);
    });

    const allActive = state.archive.folderFilter === 'all';
    const allRow = `
      <div class="archive-folder${allActive ? ' is-active' : ''}">
        <button class="archive-folder-main" type="button" data-archive-folder="all" aria-pressed="${allActive}">
          <span>全部归档</span>
          <strong>${state.archive.texts.length}</strong>
        </button>
      </div>
    `;

    const folderRows = state.archive.folders.map((folder) => {
      const active = state.archive.folderFilter === folder.id;
      const actions = folder.id === ARCHIVE_INBOX
        ? ''
        : `
          <div class="archive-folder-actions">
            <button type="button" data-folder-rename="${folder.id}" title="重命名文件夹" aria-label="重命名文件夹 ${escapeHTML(folder.name)}">✎</button>
            <button type="button" data-folder-delete="${folder.id}" title="删除文件夹" aria-label="删除文件夹 ${escapeHTML(folder.name)}">×</button>
          </div>
        `;
      return `
        <div class="archive-folder${active ? ' is-active' : ''}">
          <button class="archive-folder-main" type="button" data-archive-folder="${folder.id}" aria-pressed="${active}">
            <span>${escapeHTML(folder.name)}</span>
            <strong>${counts.get(folder.id) || 0}</strong>
          </button>
          ${actions}
        </div>
      `;
    });

    $('#archiveFolderList').innerHTML = [allRow, ...folderRows].join('');
  }

  function renderArchiveFolderSelect() {
    const select = $('#archiveFolderSelect');
    if (!select) return;
    const previous = select.value;
    const fallback = state.archive.folderFilter !== 'all'
      ? state.archive.folderFilter
      : (state.archive.folders.some((folder) => folder.id === previous) ? previous : ARCHIVE_INBOX);
    select.innerHTML = state.archive.folders
      .map((folder) => `<option value="${folder.id}">${escapeHTML(folder.name)}</option>`)
      .join('');
    select.value = state.archive.folders.some((folder) => folder.id === fallback)
      ? fallback
      : ARCHIVE_INBOX;
  }

  function renderArchiveTextList() {
    const filtered = state.archive.texts
      .filter((text) => state.archive.folderFilter === 'all' || text.folderId === state.archive.folderFilter)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const folder = state.archive.folderFilter === 'all' ? null : archiveFolderById(state.archive.folderFilter);

    $('#archiveListTitle').textContent = folder ? folder.name : '全部归档';
    $('#archiveCount').textContent = `${filtered.length} 段文字`;
    $('#archiveTextList').innerHTML = filtered.map((text) => {
      const excerpt = text.content.replace(/\s+/g, ' ').trim().slice(0, 92);
      const chars = Array.from(text.content).length;
      return `
        <article class="archive-text-card" data-archive-text-card="${text.id}">
          <button class="archive-text-open" type="button" data-open-text="${text.id}">
            <span class="archive-text-folder">${escapeHTML(archiveFolderName(text.folderId))}</span>
            <span class="archive-text-title">${escapeHTML(text.title)}</span>
            <span class="archive-text-excerpt">${escapeHTML(excerpt)}</span>
            <span class="archive-text-meta"><span>${archiveDateLabel(text.createdAt)}</span><span>${chars} 字</span></span>
          </button>
          <div class="archive-text-actions">
            <button type="button" data-rename-text="${text.id}">重命名</button>
            <button type="button" data-delete-text="${text.id}">删除</button>
          </div>
        </article>
      `;
    }).join('');
    $('#archiveEmpty').hidden = filtered.length > 0;
  }

  function updateClickedSummary() {
    const total = state.archive.clicked.size;
    $('#clickedCount').textContent = String(total);
    updateArchiveStats();
  }

  function addArchiveFolder() {
    const value = window.prompt('给新文件夹命名：');
    if (value === null) return;
    const name = value.trim().slice(0, 30);
    if (!name) {
      showToast('文件夹名称不能为空');
      return;
    }
    if (state.archive.folders.some((folder) => folder.name.toLowerCase() === name.toLowerCase())) {
      showToast('已经有同名文件夹了');
      return;
    }
    const folder = { id: archiveId('folder'), name, createdAt: new Date().toISOString() };
    state.archive.folders.push(folder);
    state.archive.folderFilter = folder.id;
    if (persistArchive()) showToast(`已创建文件夹「${name}」`);
    renderArchive();
  }

  function renameArchiveFolder(folderId) {
    const folder = archiveFolderById(folderId);
    if (!folder) return;
    const value = window.prompt('修改文件夹名称：', folder.name);
    if (value === null) return;
    const name = value.trim().slice(0, 30);
    if (!name) {
      showToast('文件夹名称不能为空');
      return;
    }
    if (state.archive.folders.some((item) => item.id !== folderId && item.name.toLowerCase() === name.toLowerCase())) {
      showToast('已经有同名文件夹了');
      return;
    }
    folder.name = name;
    if (persistArchive()) showToast(`文件夹已改名为「${name}」`);
    renderArchive();
  }

  function deleteArchiveFolder(folderId) {
    if (folderId === ARCHIVE_INBOX) {
      showToast('「未分类」是默认文件夹，不能删除');
      return;
    }
    const folder = archiveFolderById(folderId);
    if (!folder) return;
    if (!window.confirm(`删除文件夹「${folder.name}」？里面的文字会移到「未分类」。`)) return;
    state.archive.texts.forEach((text) => {
      if (text.folderId === folderId) text.folderId = ARCHIVE_INBOX;
    });
    state.archive.folders = state.archive.folders.filter((item) => item.id !== folderId);
    if (state.archive.folderFilter === folderId) state.archive.folderFilter = 'all';
    if (persistArchive()) showToast(`已删除文件夹「${folder.name}」`);
    renderArchive();
  }

  function saveArchiveText() {
    const input = $('#archiveTextInput');
    const titleInput = $('#archiveTitleInput');
    const content = input.value.replace(/\r\n/g, '\n').trim();
    if (!content) {
      showToast('先粘贴一段日语吧');
      input.focus();
      return;
    }
    const folderId = state.archive.folders.some((folder) => folder.id === $('#archiveFolderSelect').value)
      ? $('#archiveFolderSelect').value
      : ARCHIVE_INBOX;
    const now = new Date().toISOString();
    const text = {
      id: archiveId('text'),
      folderId,
      title: titleInput.value.trim().slice(0, 60) || archiveTitleFromContent(content),
      content,
      createdAt: now,
      updatedAt: now
    };
    state.archive.texts.push(text);
    state.archive.folderFilter = folderId;
    if (persistArchive()) showToast(`已归档「${text.title}」`);
    input.value = '';
    titleInput.value = '';
    renderArchive();
  }

  function renameArchiveText(textId) {
    const text = archiveTextById(textId);
    if (!text) return;
    const value = window.prompt('给这段文字重新命名：', text.title);
    if (value === null) return;
    const title = value.trim().slice(0, 60);
    if (!title) {
      showToast('名称不能为空');
      return;
    }
    text.title = title;
    text.updatedAt = new Date().toISOString();
    if (persistArchive()) showToast(`已改名为「${title}」`);
    renderArchive();
  }

  function deleteArchiveText(textId) {
    const text = archiveTextById(textId);
    if (!text) return;
    if (!window.confirm(`删除归档「${text.title}」？`)) return;
    state.archive.texts = state.archive.texts.filter((item) => item.id !== textId);
    if (state.archive.openTextId === textId) state.archive.openTextId = null;
    if (persistArchive()) showToast('已删除这段归档');
    renderArchive();
  }

  function archiveSegments(text) {
    let raw;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      raw = [...segmenter.segment(text)].map((segment) => ({
        text: segment.segment,
        wordLike: Boolean(segment.isWordLike)
      }));
    } else {
      const japaneseRun = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+/u;
      raw = String(text)
        .split(/([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+)/u)
        .filter(Boolean)
        .map((part) => ({ text: part, wordLike: japaneseRun.test(part) }));
    }

    const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]/u;
    const mergeBreak = new Set([
      'は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'か', 'ね', 'よ', 'な',
      'や', 'へ', 'から', 'まで', 'より', 'だけ', 'しか', 'ほど', 'など',
      'です', 'でした', 'だ'
    ]);
    const verbEnding = /(ます|ました|ません|て|で|た|だ|ない|なかった|たい|ながら|そう|れる|られる|せる|させる)$/;
    const merged = [];
    for (let i = 0; i < raw.length; i += 1) {
      const first = raw[i];
      if (!first.wordLike || !japanese.test(first.text) || AUXILIARY_TOKENS.has(first.text)) {
        merged.push(first);
        continue;
      }
      let best = null;
      let combined = '';
      for (let j = i; j < raw.length && j < i + 6; j += 1) {
        const part = raw[j];
        if (!part.wordLike || !japanese.test(part.text)) break;
        if (j > i && mergeBreak.has(part.text)) break;
        combined += part.text;
        const shortMerge = j === i + 1 &&
          Array.from(first.text).length === 1 &&
          Array.from(combined).length <= 3;
        if (j > i && combined.length >= 2 && (verbEnding.test(combined) || shortMerge) &&
          lookupArchiveWord(combined)) {
          best = { text: combined, wordLike: true, end: j };
        }
      }
      if (best) {
        merged.push(best);
        i = best.end;
      } else {
        merged.push(first);
      }
    }
    return merged;
  }

  const AUXILIARY_TOKENS = new Set([
    'は', 'が', 'を', 'に', 'で', 'と', 'も', 'の', 'か', 'ね', 'よ', 'な',
    'や', 'へ', 'から', 'まで', 'より', 'だけ', 'しか', 'ほど', 'など',
    'ます', 'です', 'でした', 'ません', 'だ', 'た', 'て'
  ]);

  function lookupArchiveWord(surface) {
    const normalized = normalizeArchiveSurface(surface);
    if (!normalized || AUXILIARY_TOKENS.has(normalized)) return null;
    for (const key of deinflectSurface(normalized)) {
      const word = archiveWordIndex.get(key);
      if (word) return word;
    }
    const reading = dictionaryKanjiReadings[normalized];
    if (reading) {
      for (const key of deinflectSurface(reading)) {
        const word = archiveWordIndex.get(key);
        if (word) return word;
      }
    }
    return null;
  }

  function archiveCategoryText(word) {
    const scene = sceneMap[word.scene];
    const section = sectionMap[word.section];
    return [word.level, scene?.zh, section?.zh].filter(Boolean).join(' · ');
  }

  function archiveTextHTML(content) {
    const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]/u;
    const kanji = /[\p{Script=Han}]/u;
    return archiveSegments(content).map((segment) => {
      const value = segment.text;
      const surface = value.normalize('NFC');
      const word = lookupArchiveWord(surface);
      const canClick = segment.wordLike && japanese.test(value) &&
        !AUXILIARY_TOKENS.has(surface) &&
        (Array.from(value).length > 1 || Boolean(word) || kanji.test(value));
      if (!canClick) return escapeHTML(value);

      const key = archiveTokenKey(surface, word);
      const entry = state.archive.clicked.get(key);
      const count = Number(entry?.count) || 0;
      const band = countBand(count);
      const clicked = count > 0;
      const group = word ? dictionarySceneMap[word.sceneGroup] : null;
      const category = word
        ? `${group?.jp || 'その他'} · ${word.level}`
        : '未収録';
      const label = clicked
        ? `已归档：${category} · ${count} 回`
        : `点击归类：${category}`;
      return `<button class="archive-token${clicked ? ` is-count-${band}` : ''}" type="button"
        data-archive-token="${escapeHTML(surface)}" data-token-key="${escapeHTML(key)}"
        data-count-band="${band}" title="${escapeHTML(label)}">${escapeHTML(value)}</button>`;
    }).join('');
  }

  function showArchiveTokenInfo(surface, word, clickResult = null) {
    const box = $('#archiveTokenInfo');
    if (!box) return;
    box.hidden = false;
    if (!word) {
      box.innerHTML = `
        <div class="token-info-head">
          <strong lang="ja">${escapeHTML(surface)}</strong>
          <span class="token-badge is-unlisted">未収録</span>
        </div>
        <p class="token-info-def" lang="ja">この語は 4,656 語の辞典に未収録です。文脈から意味を考えて、別の「未収録」分類にまとめています。</p>
        <div class="token-info-foot"><span>单独分类 · 未収録</span></div>
        <p class="token-info-status">${countStatusText(clickResult, state.archive.clicked.get(archiveTokenKey(surface, word))?.count)}</p>
      `;
      return;
    }
    const group = dictionarySceneMap[word.sceneGroup];
    const reading = word.reading && word.reading !== word.word
      ? `<span class="token-reading" lang="ja">${escapeHTML(word.reading)}</span>`
      : '';
    box.innerHTML = `
      <div class="token-info-head">
        <strong lang="ja">${escapeHTML(word.word)}</strong>
        ${reading}
        <span class="token-badge">${escapeHTML(word.level)}</span>
        <span class="token-scene">${escapeHTML(group?.jp || 'その他')} <small>${escapeHTML(group?.zh || '')}</small></span>
      </div>
      <p class="token-info-def" lang="ja">${escapeHTML(word.definitionJa)}</p>
      <div class="token-info-foot">
        <span class="token-zh">中文：${escapeHTML(word.meaning)}</span>
        ${word.example ? `<span class="token-example" lang="ja">例：${escapeHTML(word.example)}</span>` : ''}
      </div>
      <p class="token-info-status">${countStatusText(clickResult, state.archive.clicked.get(archiveTokenKey(surface, word))?.count)}</p>
    `;
  }

  function recordClickedWord(surface, word) {
    const key = archiveTokenKey(surface, word);
    const existing = state.archive.clicked.get(key);
    const now = new Date().toISOString();
    if (!existing) {
      state.archive.clicked.set(key, {
        key,
        surface,
        headword: word?.word || surface,
        wordId: word?.id || '',
        level: word?.level || 'unlisted',
        scene: word?.scene || '',
        sceneGroup: word?.sceneGroup || 'other',
        section: word?.section || '',
        reading: word?.reading || '',
        meaning: word?.meaning || '',
        definitionJa: word?.definitionJa || '',
        count: 1,
        firstAt: now,
        lastAt: now
      });
      persistArchive();
      updateClickedSummary();
      if ($('#clickedModal')?.getAttribute('aria-hidden') === 'false') renderClickedWords();
      return { first: true, count: 1, reset: false, key, word };
    }

    let count = (Number(existing.count) || 0) + 1;
    let reset = false;
    if (count > 10) {
      count = 0;
      reset = true;
    }
    existing.count = count;
    existing.lastAt = now;
    existing.headword = word?.word || existing.headword || surface;
    existing.definitionJa = word?.definitionJa || existing.definitionJa || '';
    existing.sceneGroup = word?.sceneGroup || existing.sceneGroup || 'other';
    state.archive.clicked.set(key, existing);
    persistArchive();
    updateClickedSummary();
    if ($('#clickedModal')?.getAttribute('aria-hidden') === 'false') renderClickedWords();
    return { first: false, count, reset, key, word };
  }

  function handleArchiveTokenClick(button) {
    const surface = button.dataset.archiveToken;
    if (!surface) return;
    const word = lookupArchiveWord(surface);
    const result = recordClickedWord(surface, word);
    const entry = state.archive.clicked.get(result.key);
    const count = Number(entry?.count) || 0;
    const band = countBand(count);
    $$('#archiveReaderText [data-token-key]').forEach((token) => {
      if (token.dataset.tokenKey !== result.key) return;
      token.classList.remove('is-clicked', 'is-count-green', 'is-count-blue', 'is-count-purple', 'is-count-red');
      token.dataset.countBand = band;
      if (count > 0) token.classList.add(`is-count-${band}`);
    });
    showArchiveTokenInfo(surface, word, result);
    if (!result.first) showWordViewCounter(word, surface, count, result.reset);
    speak(word?.word || surface, button);
  }

  function renderArchiveReader() {
    const text = archiveTextById(state.archive.openTextId);
    if (!text) return;
    resetArchiveSpeech();
    $('#archiveReaderTitle').textContent = text.title;
    $('#archiveReaderMeta').textContent = `${archiveFolderName(text.folderId)} · ${archiveDateLabel(text.createdAt)} · ${Array.from(text.content).length} 字`;
    $('#archiveReaderText').innerHTML = archiveTextHTML(text.content);
    $('#archiveTokenInfo').hidden = true;
  }

  function openArchiveText(textId) {
    if (!archiveTextById(textId)) return;
    state.archive.openTextId = textId;
    renderArchiveReader();
    openModal($('#archiveReaderModal'));
  }

  function readArchiveText() {
    const text = archiveTextById(state.archive.openTextId);
    if (!text) return;
    startArchiveSpeech(0);
  }

  function archiveSpeechText() {
    const text = archiveTextById(state.archive.openTextId);
    return text ? text.content : '';
  }

  function clearArchiveProgressTimer() {
    if (archiveSpeech.timer) {
      window.clearInterval(archiveSpeech.timer);
      archiveSpeech.timer = null;
    }
  }

  function ensureArchiveCaret() {
    const container = $('#archiveReaderText');
    if (!container) return null;
    let caret = $('#archiveSpeechCaret');
    if (!caret) {
      caret = document.createElement('div');
      caret.id = 'archiveSpeechCaret';
      caret.className = 'speech-caret';
      caret.setAttribute('aria-hidden', 'true');
      container.append(caret);
    }
    return caret;
  }

  function hideArchiveCaret() {
    const caret = $('#archiveSpeechCaret');
    if (!caret) return;
    caret.classList.remove('is-visible', 'is-paused');
  }

  function archiveTextPosition(container, offset) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest('.speech-caret')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let remaining = Math.max(0, Number(offset) || 0);
    let last = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const length = node.nodeValue.length;
      last = { node, offset: length };
      if (remaining <= length) return { node, offset: remaining };
      remaining -= length;
    }
    return last || { node: null, offset: 0 };
  }

  function positionArchiveCaret(position) {
    const container = $('#archiveReaderText');
    if (!container || !archiveSpeech.text) return;
    const caret = ensureArchiveCaret();
    if (!caret) return;
    const pos = archiveTextPosition(container, position);
    if (!pos.node) {
      hideArchiveCaret();
      return;
    }

    const range = document.createRange();
    let rect = null;
    let left = 0;
    try {
      if (pos.offset >= pos.node.nodeValue.length) {
        const end = pos.node.nodeValue.length;
        range.setStart(pos.node, Math.max(0, end - 1));
        range.setEnd(pos.node, end);
        rect = range.getBoundingClientRect();
        left = rect.right;
      } else {
        range.setStart(pos.node, pos.offset);
        range.setEnd(pos.node, Math.min(pos.node.nodeValue.length, pos.offset + 1));
        rect = range.getBoundingClientRect();
        left = rect.left;
      }
    } catch (error) {
      hideArchiveCaret();
      return;
    }
    if (!rect || (!rect.width && !rect.height)) {
      rect = pos.node.parentElement?.getBoundingClientRect() || null;
      if (rect) left = rect.left;
    }
    if (!rect) {
      hideArchiveCaret();
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const top = rect.top - containerRect.top + container.scrollTop;
    const caretLeft = left - containerRect.left + container.scrollLeft;
    caret.style.left = `${caretLeft}px`;
    caret.style.top = `${top}px`;
    caret.style.height = `${Math.max(16, rect.height || 24)}px`;
    caret.classList.add('is-visible');
    caret.classList.toggle('is-paused', Boolean(archiveSpeech.paused));

    if (rect.top < containerRect.top + 10) {
      container.scrollTop += rect.top - containerRect.top - 10;
    } else if (rect.bottom > containerRect.bottom - 10) {
      container.scrollTop += rect.bottom - containerRect.bottom + 10;
    }
  }

  function setArchivePauseButton(paused, enabled) {
    const button = $('#archivePauseBtn');
    if (!button) return;
    button.disabled = !enabled;
    button.textContent = paused ? '继续' : '暂停';
    button.classList.toggle('is-paused', Boolean(paused));
    button.setAttribute('aria-label', paused ? '继续朗读' : '暂停朗读');
  }

  function startArchiveProgressTimer(speechState, content) {
    clearArchiveProgressTimer();
    speechState.timer = window.setInterval(() => {
      if (archiveSpeech !== speechState || !speechState.active || speechState.paused) return;
      const now = performance.now();
      if (speechState.lastBoundaryAt && now - speechState.lastBoundaryAt < 900) return;
      const estimated = speechState.basePosition +
        ((now - speechState.startedAt) / 1000) * 5.2;
      if (estimated <= speechState.position) return;
      speechState.position = Math.min(content.length - 1, estimated);
      setArchiveProgress(speechState.position, '朗读中…');
    }, 180);
  }

  function setArchiveProgress(position, status) {
    const total = archiveSpeech.text.length;
    const safePosition = total
      ? Math.max(0, Math.min(total, Number(position) || 0))
      : 0;
    archiveSpeech.position = safePosition;
    const percent = total ? Math.min(100, Math.round((safePosition / total) * 100)) : 0;
    const fill = $('#archiveProgressFill');
    const track = $('#archiveProgressTrack');
    const value = $('#archiveSpeechPercent');
    const label = $('#archiveSpeechStatus');
    if (fill) fill.style.width = `${percent}%`;
    if (value) value.textContent = `${percent}%`;
    if (track) track.setAttribute('aria-valuenow', String(percent));
    if (label && status) label.textContent = status;
    if (archiveSpeech.text && (archiveSpeech.active || archiveSpeech.paused)) {
      positionArchiveCaret(safePosition);
    } else {
      hideArchiveCaret();
    }
  }

  function resetArchiveSpeech(status = '朗读待機') {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearArchiveProgressTimer();
    clearSpeechButton();
    archiveSpeech = {
      active: false,
      text: '',
      position: 0,
      utterance: null,
      timer: null,
      basePosition: 0,
      startedAt: 0,
      lastBoundaryAt: 0,
      paused: false
    };
    setArchivePauseButton(false, false);
    setArchiveProgress(0, status);
    hideArchiveCaret();
  }

  function startArchiveSpeech(offset = 0) {
    const content = archiveSpeechText();
    if (!content.trim()) return;
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前浏览器不支持语音朗读');
      return;
    }

    refreshVoices();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearArchiveProgressTimer();
    clearSpeechButton();

    const startAt = Math.max(0, Math.min(content.length - 1, Math.round(Number(offset) || 0)));
    const utterance = new SpeechSynthesisUtterance(content.slice(startAt));
    utterance.lang = 'ja-JP';
    utterance.rate = 0.86;
    utterance.pitch = 1;
    if (jaVoice) utterance.voice = jaVoice;

    const speechState = {
      active: true,
      text: content,
      position: startAt,
      utterance,
      timer: null,
      basePosition: startAt,
      startedAt: performance.now(),
      lastBoundaryAt: 0,
      paused: false
    };
    archiveSpeech = speechState;
    activeSpeechButton = $('#archiveReadAllBtn');
    activeSpeechButton?.classList.add('is-speaking');
    setArchivePauseButton(false, true);
    ensureArchiveCaret();
    setArchiveProgress(startAt, startAt > 0 ? '朗读を再開中…' : '朗读中…');

    utterance.onboundary = (event) => {
      if (archiveSpeech !== speechState || !speechState.active) return;
      if (!Number.isFinite(event.charIndex)) return;
      const absolute = Math.min(content.length, startAt + event.charIndex);
      speechState.position = absolute;
      speechState.basePosition = absolute;
      speechState.startedAt = performance.now();
      speechState.lastBoundaryAt = performance.now();
      setArchiveProgress(absolute, '朗读中…');
    };

    utterance.onend = () => {
      if (archiveSpeech !== speechState) return;
      speechState.active = false;
      clearArchiveProgressTimer();
      clearSpeechButton();
      setArchivePauseButton(false, false);
      setArchiveProgress(content.length, '読み終わりました');
      hideArchiveCaret();
    };

    utterance.onerror = (event) => {
      if (archiveSpeech !== speechState) return;
      speechState.active = false;
      clearArchiveProgressTimer();
      clearSpeechButton();
      setArchivePauseButton(false, false);
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setArchiveProgress(speechState.position, '朗读を停止しました');
      hideArchiveCaret();
    };

    // Chrome/Safari do not always emit boundary events for Japanese voices.
    // Move the bar on a gentle estimate, then correct it on each boundary.
    startArchiveProgressTimer(speechState, content);

    window.speechSynthesis.speak(utterance);
  }

  function stopArchiveSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearArchiveProgressTimer();
    archiveSpeech.active = false;
    archiveSpeech.paused = false;
    clearSpeechButton();
    setArchivePauseButton(false, false);
    if (archiveSpeech.text) {
      setArchiveProgress(archiveSpeech.position, '停止しました');
    }
    hideArchiveCaret();
  }

  function toggleArchivePause() {
    if (!archiveSpeech.active || !archiveSpeech.utterance) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (!archiveSpeech.paused) {
      try {
        synth.pause();
      } catch (error) {
        return;
      }
      archiveSpeech.paused = true;
      clearArchiveProgressTimer();
      setArchiveProgress(archiveSpeech.position, '一時停止');
      setArchivePauseButton(true, true);
      positionArchiveCaret(archiveSpeech.position);
      return;
    }

    try {
      synth.resume();
    } catch (error) {
      return;
    }
    archiveSpeech.paused = false;
    archiveSpeech.basePosition = archiveSpeech.position;
    archiveSpeech.startedAt = performance.now();
    archiveSpeech.lastBoundaryAt = 0;
    setArchiveProgress(archiveSpeech.position, '朗读中…');
    setArchivePauseButton(false, true);
    startArchiveProgressTimer(archiveSpeech, archiveSpeech.text);
  }

  function seekArchiveSpeech(deltaRatio) {
    const content = archiveSpeech.text || archiveSpeechText();
    if (!content) return;
    const from = archiveSpeech.text ? archiveSpeech.position : 0;
    const target = Math.max(0, Math.min(
      content.length - 1,
      Math.round(from + content.length * deltaRatio)
    ));
    startArchiveSpeech(target);
  }

  function seekArchiveSpeechToRatio(ratio) {
    const content = archiveSpeech.text || archiveSpeechText();
    if (!content) return;
    startArchiveSpeech(Math.round(content.length * Math.max(0, Math.min(1, ratio))));
  }

  function clickedWordHTML(entry) {
    const group = dictionarySceneMap[entry.sceneGroup] || dictionarySceneMap.other;
    const key = entry.key || archiveTokenKey(entry.surface, wordMap.get(entry.wordId));
    const unlisted = entry.level === 'unlisted';
    const meta = unlisted
      ? '未収録 · 单独分类'
      : [entry.level, group?.jp, group?.zh].filter(Boolean).join(' · ');
    const reading = entry.reading && entry.reading !== entry.headword
      ? `<span class="wrong-read" lang="ja">${escapeHTML(entry.reading)}</span>`
      : '';
    const definition = entry.definitionJa ||
      (unlisted ? '辞典に未収録の語。文脈から意味を考えてみましょう。' : '語釈を準備中です。');
    const count = Number(entry.count) || 0;
    const band = countBand(count);
    const bandClass = count > 0 ? ` count-${band}` : '';

    return `
      <div class="wrong-item${bandClass}" data-clicked-item="${escapeHTML(key)}" data-count-band="${band}">
        <button class="word-audio" type="button" data-clicked-audio="${escapeHTML(key)}" aria-label="朗读 ${escapeHTML(entry.headword || entry.surface)}">
          ${icon('speaker')}
        </button>
        <div class="wrong-info">
          <div class="wrong-line">
            <span class="wrong-word" lang="ja">${escapeHTML(entry.headword || entry.surface)}</span>
            ${reading}
            ${unlisted ? '<span class="token-badge is-unlisted">未収録</span>' : `<span class="token-badge">${escapeHTML(entry.level)}</span>`}
          </div>
          <p class="wrong-meaning is-ja" lang="ja">${escapeHTML(definition)}</p>
          <p class="wrong-meta">${escapeHTML(meta)}</p>
        </div>
        <div class="wrong-stats">
          <span class="clicked-tag${bandClass}" title="${escapeHTML(countBandLabel(count))}">再読 ${count} / 10</span>
        </div>
        <button class="wrong-remove" type="button" data-clicked-remove="${escapeHTML(key)}"
          aria-label="移出点击词：${escapeHTML(entry.headword || entry.surface)}" title="移出点击词">
          ${icon('close')}
        </button>
      </div>
    `;
  }

  function renderClickedWords() {
    const allEntries = [...state.archive.clicked.values()];
    const counts = Object.fromEntries(
      [...LEVELS.map((level) => level.id), 'unlisted'].map((levelId) => [
        levelId,
        allEntries.filter((entry) => (entry.level || 'unlisted') === levelId).length
      ])
    );

    if (state.archive.clickedLevel !== 'all' && !counts[state.archive.clickedLevel]) {
      state.archive.clickedLevel = 'all';
    }

    const levelEntries = allEntries.filter(
      (entry) => state.archive.clickedLevel === 'all' ||
        (entry.level || 'unlisted') === state.archive.clickedLevel
    );
    const knownEntries = levelEntries.filter((entry) => entry.level !== 'unlisted');
    const sceneCounts = new Map();
    knownEntries.forEach((entry) => {
      const groupId = entry.sceneGroup || 'other';
      sceneCounts.set(groupId, (sceneCounts.get(groupId) || 0) + 1);
    });

    const sceneOptions = [`<option value="all">全部場面（${knownEntries.length}）</option>`];
    dictionarySceneGroups.forEach((scene) => {
      const count = sceneCounts.get(scene.id) || 0;
      if (!count) return;
      sceneOptions.push(`<option value="${scene.id}">${escapeHTML(scene.jp)} · ${escapeHTML(scene.zh)}（${count}）</option>`);
    });

    const validSceneIds = new Set(sceneCounts.keys());
    if (state.archive.clickedScene !== 'all' && !validSceneIds.has(state.archive.clickedScene)) {
      state.archive.clickedScene = 'all';
    }

    const sceneSelect = $('#clickedSceneFilter');
    sceneSelect.innerHTML = sceneOptions.join('');
    sceneSelect.value = state.archive.clickedScene;
    const hideScene = state.archive.clickedLevel === 'unlisted' || knownEntries.length === 0;
    $('#clickedSceneFilterWrap').hidden = hideScene;
    sceneSelect.disabled = hideScene;

    $('#clickedLevelFilters').innerHTML = [
      `<button type="button" class="wrongbook-level${state.archive.clickedLevel === 'all' ? ' is-active' : ''}" data-clicked-level="all" aria-pressed="${state.archive.clickedLevel === 'all'}">全部 <span>${allEntries.length}</span></button>`,
      ...LEVELS.map(
        (level) =>
          `<button type="button" class="wrongbook-level${state.archive.clickedLevel === level.id ? ' is-active' : ''}" data-clicked-level="${level.id}" aria-pressed="${state.archive.clickedLevel === level.id}">${level.id} <span>${counts[level.id]}</span></button>`
      ),
      `<button type="button" class="wrongbook-level${state.archive.clickedLevel === 'unlisted' ? ' is-active' : ''}" data-clicked-level="unlisted" aria-pressed="${state.archive.clickedLevel === 'unlisted'}">未収録 <span>${counts.unlisted}</span></button>`
    ].join('');

    let entries = levelEntries;
    if (state.archive.clickedScene !== 'all' && state.archive.clickedLevel !== 'unlisted') {
      entries = entries.filter((entry) => (entry.sceneGroup || 'other') === state.archive.clickedScene);
    }

    entries.sort((a, b) => {
      const sceneDifference = (dictionarySceneOrder.get(a.sceneGroup || 'other') ?? 99) -
        (dictionarySceneOrder.get(b.sceneGroup || 'other') ?? 99);
      if (sceneDifference) return sceneDifference;
      const levelDifference = (wordOrder.get(a.wordId) ?? 9999) - (wordOrder.get(b.wordId) ?? 9999);
      if (levelDifference) return levelDifference;
      return (a.headword || a.surface).localeCompare(b.headword || b.surface, 'ja');
    });

    const groups = new Map();
    entries.forEach((entry) => {
      const key = entry.level === 'unlisted' ? 'unlisted' : (entry.sceneGroup || 'other');
      if (!groups.has(key)) {
        groups.set(key, {
          unlisted: entry.level === 'unlisted',
          scene: dictionarySceneMap[entry.sceneGroup] || dictionarySceneMap.other,
          items: []
        });
      }
      groups.get(key).items.push(entry);
    });

    $('#clickedSummary').textContent = state.archive.clickedLevel === 'all' && state.archive.clickedScene === 'all'
      ? `${entries.length} 个点击词 · 再読回数は右下に表示`
      : `${entries.length} 个点击词 · 共 ${allEntries.length} 个`;
    $('#clickedList').innerHTML = [...groups.values()]
      .map((group) => `
        <div class="wrong-group">
          <div class="wrong-group-head">
            <span class="wrong-group-level${group.unlisted ? ' is-unlisted' : ''}">${group.unlisted ? '未収録' : escapeHTML(group.scene?.jp || 'その他')}</span>
            <span>${escapeHTML(group.unlisted ? '单独分类 · 4,656語の外' : (group.scene?.zh || 'その他'))}</span>
            <small>${group.items.length} 語</small>
          </div>
          ${group.items.map(clickedWordHTML).join('')}
        </div>
      `)
      .join('');
    $('#clickedList').hidden = entries.length === 0;
    $('#clickedEmpty').hidden = entries.length !== 0;
  }

  function openClickedBook() {
    state.archive.clickedLevel = 'all';
    state.archive.clickedScene = 'all';
    renderClickedWords();
    openModal($('#clickedModal'));
  }

  function removeClickedWord(key) {
    const entry = state.archive.clicked.get(key);
    if (!entry) return;
    state.archive.clicked.delete(key);
    persistArchive();
    updateClickedSummary();
    renderClickedWords();
    showToast(`已移出点击词：「${entry.headword || entry.surface}」`);
  }

  /* ── Scene dictionary ─────────────────────────────────── */

  function renderSceneDictionary() {
    const scene = dictionarySceneMap[state.sceneDict.sceneId] || dictionarySceneMap.other;
    const query = normalizeSearch(state.sceneDict.query);
    const words = VOCAB
      .filter((word) => word.sceneGroup === scene.id)
      .filter((word) => {
        if (!query) return true;
        return normalizeSearch([
          word.word, word.reading, word.meaning, word.definitionJa,
          word.example, word.exampleZh, word.level
        ].join(' ')).includes(query);
      });

    $('#sceneDictTitle').textContent = scene.jp;
    $('#sceneDictSub').textContent = `${scene.desc} ${scene.zh}。`;
    $('#sceneDictCount').textContent = `${words.length.toLocaleString('ja-JP')} 語`;

    $('#sceneDictList').innerHTML = words.map((word) => {
      const reading = word.reading && word.reading !== word.word
        ? `<span class="scene-dict-reading" lang="ja">${escapeHTML(word.reading)}</span>`
        : '';
      return `
        <article class="scene-dict-item">
          <button class="word-audio" type="button" data-dict-speak="${word.id}" aria-label="朗读 ${escapeHTML(word.word)}">
            ${icon('speaker')}
          </button>
          <div class="scene-dict-info">
            <div class="scene-dict-line">
              <strong lang="ja">${escapeHTML(word.word)}</strong>
              ${reading}
              <span class="token-badge">${escapeHTML(word.level)}</span>
            </div>
            <p class="scene-dict-def" lang="ja">${escapeHTML(word.definitionJa)}</p>
            <p class="scene-dict-zh">中文：${escapeHTML(word.meaning)}</p>
          </div>
        </article>
      `;
    }).join('');

    $('#sceneDictList').hidden = words.length === 0;
    $('#sceneDictEmpty').hidden = words.length !== 0;
  }

  function openSceneDictionary(sceneId) {
    if (!dictionarySceneMap[sceneId]) return;
    state.sceneDict.sceneId = sceneId;
    state.sceneDict.query = '';
    const search = $('#sceneDictSearch');
    if (search) search.value = '';
    renderSceneDictionary();
    openModal($('#sceneDictModal'));
    window.setTimeout(() => $('#sceneDictSearch')?.focus({ preventScroll: true }), 120);
  }

  /* ── Right-bottom view counter ────────────────────────── */

  let wordCounterTimer = null;

  function hideWordViewCounter() {
    const box = $('#wordViewCounter');
    if (!box) return;
    box.classList.remove('is-visible');
    box.setAttribute('aria-hidden', 'true');
    window.clearTimeout(wordCounterTimer);
  }

  function showWordViewCounter(word, surface, count, reset) {
    const box = $('#wordViewCounter');
    if (!box) return;
    const headword = word?.word || surface;
    const group = word ? dictionarySceneMap[word.sceneGroup] : null;
    const safeCount = Math.max(0, Math.min(10, Number(count) || 0));

    $('#wvcWord').textContent = headword;
    $('#wvcReading').textContent = word?.reading && word.reading !== headword ? word.reading : '';
    $('#wvcScene').textContent = word
      ? `${word.level} · ${group?.jp || 'その他'} · ${group?.zh || ''}`
      : '未収録 · 单独分类';
    $('#wvcCount').textContent = `${safeCount} / 10`;
    $('#wvcBar').style.width = `${safeCount * 10}%`;
    box.classList.toggle('is-reset', Boolean(reset));
    box.classList.remove('band-green', 'band-blue', 'band-purple', 'band-red');
    const band = reset ? 'normal' : countBand(safeCount);
    if (band !== 'normal') box.classList.add(`band-${band}`);
    box.dataset.band = band;
    if ($('#wvcBand')) {
      $('#wvcBand').textContent = reset
        ? '0に戻りました · 単語の色も元通り'
        : countBandLabel(safeCount);
    }
    $('#wvcNote').textContent = reset
      ? '10回を超えたので、0に戻しました。'
      : safeCount === 10
        ? '次に見直すと0に戻ります。'
        : '10回を超えると0に戻ります。';

    box.hidden = false;
    box.setAttribute('aria-hidden', 'false');
    window.clearTimeout(wordCounterTimer);
    window.requestAnimationFrame(() => box.classList.add('is-visible'));
    wordCounterTimer = window.setTimeout(hideWordViewCounter, 5600);
  }

  /* ── Modals ────────────────────────────────────────────── */

  function getOpenModal() {
    return $('.modal[aria-hidden="false"]');
  }

  function openModal(modal) {
    if (!modal) return;
    const previousFocus = state.lastFocus;
    closeAllModals(false);
    const activeElement = document.activeElement;
    state.lastFocus =
      activeElement && activeElement.closest('.modal') ? previousFocus : activeElement;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const panel = modal.querySelector('.modal-panel');
    if (panel) {
      panel.setAttribute('tabindex', '-1');
      panel.focus({ preventScroll: true });
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    if (!getOpenModal()) {
      document.body.classList.remove('modal-open');
    }

    let focusTarget = state.lastFocus;
    if (focusTarget && !focusTarget.isConnected) {
      focusTarget = state.study?.meta?.sceneId
        ? $(`.scene-card[data-scene="${state.study.meta.sceneId}"]`)
        : $('#reviewBtn');
    }
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus({ preventScroll: true });
    }
    state.lastFocus = null;

    if (modal.id === 'archiveReaderModal') {
      stopArchiveSpeech();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      clearSpeechButton();
    }
  }

  function closeAllModals(restoreFocus = true) {
    $$('.modal[aria-hidden="false"]').forEach((modal) => {
      modal.setAttribute('aria-hidden', 'true');
    });
    if (restoreFocus && state.lastFocus && typeof state.lastFocus.focus === 'function') {
      state.lastFocus.focus({ preventScroll: true });
    }
    state.lastFocus = null;
    document.body.classList.remove('modal-open');
  }

  function trapFocus(event) {
    const modal = getOpenModal();
    if (!modal || event.key !== 'Tab') return;

    const focusable = $$(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      modal
    ).filter((element) => element.offsetParent !== null && !element.hidden);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const panel = modal.querySelector('.modal-panel');

    if (document.activeElement === panel) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ── Speech ────────────────────────────────────────────── */

  const VOICE_STORAGE_KEY = 'kotoba-mori-voice-v1';

  function renderVoiceSelect() {
    const select = $('#archiveVoiceSelect');
    if (!select) return;
    if (!jaVoices.length) {
      select.innerHTML = '<option value="">日本語の音色が見つかりません</option>';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML = jaVoices.map((voice) => {
      const key = voice.voiceURI || voice.name;
      const lang = voice.lang ? ` · ${voice.lang}` : '';
      return `<option value="${escapeHTML(key)}">${escapeHTML(voice.name)}${escapeHTML(lang)}</option>`;
    }).join('');
    select.value = selectedVoiceKey || (jaVoice ? (jaVoice.voiceURI || jaVoice.name) : '');
  }

  function setArchiveVoice(key) {
    const voice = jaVoices.find((item) => (item.voiceURI || item.name) === key);
    if (!voice) return;
    jaVoice = voice;
    selectedVoiceKey = voice.voiceURI || voice.name;
    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, selectedVoiceKey);
    } catch (error) {
      /* localStorage may be unavailable under file://; voice still works for this session. */
    }
  }

  function refreshVoices() {
    if (!window.speechSynthesis) {
      jaVoices = [];
      renderVoiceSelect();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    jaVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith('ja'));
    if (!jaVoices.length) {
      jaVoice = null;
      selectedVoiceKey = '';
      renderVoiceSelect();
      return;
    }
    let saved = '';
    try {
      saved = window.localStorage.getItem(VOICE_STORAGE_KEY) || '';
    } catch (error) {
      saved = '';
    }
    const current = jaVoice
      ? jaVoices.find((voice) => (voice.voiceURI || voice.name) === (jaVoice.voiceURI || jaVoice.name))
      : null;
    jaVoice = jaVoices.find((voice) => (voice.voiceURI || voice.name) === saved) ||
      current ||
      jaVoices[0];
    selectedVoiceKey = jaVoice.voiceURI || jaVoice.name;
    renderVoiceSelect();
  }

  function clearSpeechButton() {
    if (activeSpeechButton) {
      activeSpeechButton.classList.remove('is-speaking');
      activeSpeechButton = null;
    }
  }

  function exampleSpeechText(value) {
    return String(value)
      .replace(/(^|[\n。！？」])\s*[A-ZＡ-Ｚ]\s*(?=[「:：])/g, '$1')
      .replace(/(^|\n)\s*[A-ZＡ-Ｚ]\s*[:：]\s*/g, '$1')
      .replace(/[「」]/g, '')
      .replace(/\n+/g, '。')
      .replace(/。{2,}/g, '。')
      .trim();
  }

  function speak(text, button) {
    if (!text) return;
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      showToast('当前浏览器不支持语音朗读');
      return;
    }

    if (archiveSpeech.active) stopArchiveSpeech();
    refreshVoices();
    window.speechSynthesis.cancel();
    clearSpeechButton();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.86;
    utterance.pitch = 1;
    if (jaVoice) utterance.voice = jaVoice;

    if (button) {
      activeSpeechButton = button;
      button.classList.add('is-speaking');
      const clear = () => {
        if (activeSpeechButton === button) clearSpeechButton();
      };
      utterance.onend = clear;
      utterance.onerror = clear;
    }

    window.speechSynthesis.speak(utterance);
  }

  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  }

  /* ── Feedback ──────────────────────────────────────────── */

  function showToast(message) {
    const stack = $('#toastStack');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon" aria-hidden="true">✓</span><span>${escapeHTML(message)}</span>`;
    stack.append(toast);

    window.setTimeout(() => {
      toast.classList.add('is-out');
      window.setTimeout(() => toast.remove(), 280);
    }, 2500);
  }

  /* ── Events ────────────────────────────────────────────── */

  function onActivate(container, selector, callback) {
    container.addEventListener('click', (event) => {
      const target = event.target.closest(selector);
      if (target) callback(target);
    });

    container.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest(selector);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      callback(target);
    });
  }

  function bindEvents() {
    onActivate($('#levelGrid'), '[data-level]', (card) => setLevel(card.dataset.level));
    onActivate($('#sceneGrid'), '[data-scene]', (card) => openSceneDictionary(card.dataset.scene));

    $('#sceneFilters').addEventListener('click', (event) => {
      const chip = event.target.closest('[data-scene]');
      if (!chip) return;
      state.sceneFilter = chip.dataset.scene;
      renderSectionFilter();
      renderLibrary(true);
    });

    $('#sectionFilter').addEventListener('change', (event) => {
      state.sectionFilter = event.target.value;
      renderLibrary(true);
    });

    $('#statusToggle').addEventListener('click', (event) => {
      const button = event.target.closest('[data-status]');
      if (!button) return;
      state.statusFilter = button.dataset.status;
      renderLibrary(true);
    });

    $('#searchInput').addEventListener('input', (event) => {
      state.query = event.target.value;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => renderLibrary(true), 90);
    });

    $('#searchInput').addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      window.clearTimeout(searchTimer);
      if (event.target.value) {
        event.target.value = '';
        state.query = '';
        renderLibrary(true);
      } else {
        event.target.blur();
      }
    });

    $('#resetFiltersBtn').addEventListener('click', () => {
      window.clearTimeout(searchTimer);
      state.query = '';
      state.sceneFilter = 'all';
      state.sectionFilter = 'all';
      state.statusFilter = 'all';
      $('#searchInput').value = '';
      renderFilterChips();
      renderSectionFilter();
      renderLibrary(true);
      $('#sceneFilters .filter-chip')?.focus({ preventScroll: true });
    });

    $('#loadMoreBtn').addEventListener('click', () => {
      state.visibleCount += LIBRARY_PAGE_SIZE;
      renderLibrary(false);
    });

    $('#wordList').addEventListener('click', (event) => {
      const exampleButton = event.target.closest('[data-example-speak]');
      if (exampleButton) {
        const word = wordMap.get(exampleButton.dataset.exampleSpeak);
        if (word && word.example) speak(exampleSpeechText(word.example), exampleButton);
        return;
      }

      const speakButton = event.target.closest('[data-speak]');
      if (speakButton) {
        const word = wordMap.get(speakButton.dataset.speak);
        if (word) speak(word.word, speakButton);
        return;
      }

      const learnButton = event.target.closest('[data-learn]');
      if (learnButton) {
        const wordId = learnButton.dataset.learn;
        setLearned(wordId, !state.learned.has(wordId));
      }
    });

    $('#reviewBtn').addEventListener('click', openReview);

    $('#heroReadingBtn').addEventListener('click', () => {
      const textId = $('#heroReadingBtn').dataset.textId;
      if (textId && archiveTextById(textId)) {
        openArchiveText(textId);
        return;
      }
      $('#archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#archiveTextInput').focus({ preventScroll: true });
    });

    $('#heroArchiveBtn').addEventListener('click', () => {
      $('#archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('#archiveTextInput').focus({ preventScroll: true });
    });

    $('#startQuizBtn').addEventListener('click', startQuiz);
    $('#retryQuiz').addEventListener('click', () => {
      if (state.quiz?.mode === 'wrong' && getSelectedWrongEntries().length) {
        startWrongQuiz();
      } else {
        startQuiz();
      }
    });
    $('#nextQuestion').addEventListener('click', nextQuizQuestion);
    $('#quizDontKnowBtn').addEventListener('click', () => {
      answerQuiz(null, { dontKnow: true });
    });

    $('#quizOptions').addEventListener('click', (event) => {
      const option = event.target.closest('[data-option]');
      if (option) answerQuiz(Number(option.dataset.option));
    });

    $('#quizAudioBtn').addEventListener('click', () => {
      if (!state.quiz) return;
      const question = state.quiz.questions[state.quiz.index];
      if (question) speak(question.word.word, $('#quizAudioBtn'));
    });

    $('#openWrongBookBtn').addEventListener('click', openWrongBook);
    $('#wrongBookNav').addEventListener('click', (event) => {
      event.preventDefault();
      openWrongBook();
    });

    $('#wrongLevelFilters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-wrong-level]');
      if (!button) return;
      state.wrongLevel = button.dataset.wrongLevel;
      state.wrongScene = 'all';
      renderWrongBook();
    });

    $('#wrongSceneFilter').addEventListener('change', (event) => {
      state.wrongScene = event.target.value;
      renderWrongBook();
    });

    $('#wrongList').addEventListener('click', (event) => {
      const audioButton = event.target.closest('[data-wrong-audio]');
      if (audioButton) {
        const word = wordMap.get(audioButton.dataset.wrongAudio);
        if (word) speak(word.word, audioButton);
        return;
      }

      const removeButton = event.target.closest('[data-wrong-remove]');
      if (removeButton) {
        removeWrong(removeButton.dataset.wrongRemove);
        renderWrongBook();
        $('#wrongLevelFilters .wrongbook-level.is-active')?.focus({ preventScroll: true });
      }
    });

    $('#retryWrongBtn').addEventListener('click', startWrongQuiz);
    $('#clearWrongBtn').addEventListener('click', clearWrongBook);
    $('#wrongToQuiz').addEventListener('click', () => {
      closeModal($('#wrongModal'));
      startQuiz();
    });

    $('#openMasteredBtn').addEventListener('click', openMasteredBook);
    $('#masteredNav').addEventListener('click', (event) => {
      event.preventDefault();
      openMasteredBook();
    });

    $('#masteredLevelFilters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-mastered-level]');
      if (!button) return;
      state.masteredLevel = button.dataset.masteredLevel;
      state.masteredScene = 'all';
      renderMasteredBook();
    });

    $('#masteredSceneFilter').addEventListener('change', (event) => {
      state.masteredScene = event.target.value;
      renderMasteredBook();
    });

    $('#masteredList').addEventListener('click', (event) => {
      const audioButton = event.target.closest('[data-mastered-audio]');
      if (audioButton) {
        const word = wordMap.get(audioButton.dataset.masteredAudio);
        if (word) speak(word.word, audioButton);
        return;
      }

      const removeButton = event.target.closest('[data-mastered-remove]');
      if (removeButton) {
        removeMastered(removeButton.dataset.masteredRemove);
        $('#masteredLevelFilters .wrongbook-level.is-active')?.focus({ preventScroll: true });
      }
    });

    $('#masteredReviewBtn').addEventListener('click', startMasteredReview);
    $('#masteredToScenes').addEventListener('click', () => {
      closeModal($('#masteredModal'));
      $('#scenes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#openDataBtn')?.addEventListener('click', openDataModal);
    $('#exportDataBtn')?.addEventListener('click', downloadBackup);
    $('#importDataInput')?.addEventListener('change', importBackupFile);
    $('#newArchiveFolderBtn').addEventListener('click', addArchiveFolder);
    $('#saveArchiveBtn').addEventListener('click', saveArchiveText);

    $('#archiveFolderList').addEventListener('click', (event) => {
      const renameButton = event.target.closest('[data-folder-rename]');
      if (renameButton) {
        renameArchiveFolder(renameButton.dataset.folderRename);
        return;
      }
      const deleteButton = event.target.closest('[data-folder-delete]');
      if (deleteButton) {
        deleteArchiveFolder(deleteButton.dataset.folderDelete);
        return;
      }
      const filterButton = event.target.closest('[data-archive-folder]');
      if (!filterButton) return;
      state.archive.folderFilter = filterButton.dataset.archiveFolder;
      renderArchive();
    });

    $('#archiveTextList').addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-open-text]');
      if (openButton) {
        openArchiveText(openButton.dataset.openText);
        return;
      }
      const renameButton = event.target.closest('[data-rename-text]');
      if (renameButton) {
        renameArchiveText(renameButton.dataset.renameText);
        return;
      }
      const deleteButton = event.target.closest('[data-delete-text]');
      if (deleteButton) {
        deleteArchiveText(deleteButton.dataset.deleteText);
      }
    });

    $('#archiveEmptyFocusBtn').addEventListener('click', () => {
      $('#archiveTextInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('#archiveTextInput').focus({ preventScroll: true });
    });

    $('#archiveReadAllBtn').addEventListener('click', readArchiveText);
    $('#archivePauseBtn')?.addEventListener('click', toggleArchivePause);
    $('#archiveStopBtn').addEventListener('click', stopArchiveSpeech);
    $('#archiveSeekBack')?.addEventListener('click', () => seekArchiveSpeech(-0.1));
    $('#archiveSeekForward')?.addEventListener('click', () => seekArchiveSpeech(0.1));
    $('#archiveVoiceSelect')?.addEventListener('change', (event) => {
      setArchiveVoice(event.target.value);
    });
    $('#archiveProgressTrack')?.addEventListener('click', (event) => {
      const track = event.currentTarget;
      const rect = track.getBoundingClientRect();
      if (!rect.width) return;
      seekArchiveSpeechToRatio((event.clientX - rect.left) / rect.width);
    });
    $('#archiveProgressTrack')?.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      seekArchiveSpeech(event.key === 'ArrowLeft' ? -0.1 : 0.1);
    });

    $('#archiveReaderText').addEventListener('click', (event) => {
      const token = event.target.closest('[data-archive-token]');
      if (token) handleArchiveTokenClick(token);
    });

    $('#openClickedBtn').addEventListener('click', openClickedBook);

    $('#clickedLevelFilters').addEventListener('click', (event) => {
      const button = event.target.closest('[data-clicked-level]');
      if (!button) return;
      state.archive.clickedLevel = button.dataset.clickedLevel;
      state.archive.clickedScene = 'all';
      renderClickedWords();
    });

    $('#clickedSceneFilter').addEventListener('change', (event) => {
      state.archive.clickedScene = event.target.value;
      renderClickedWords();
    });

    $('#clickedList').addEventListener('click', (event) => {
      const audioButton = event.target.closest('[data-clicked-audio]');
      if (audioButton) {
        const entry = state.archive.clicked.get(audioButton.dataset.clickedAudio);
        if (entry) speak(entry.headword || entry.surface, audioButton);
        return;
      }
      const removeButton = event.target.closest('[data-clicked-remove]');
      if (removeButton) {
        removeClickedWord(removeButton.dataset.clickedRemove);
        $('#clickedLevelFilters .wrongbook-level.is-active')?.focus({ preventScroll: true });
      }
    });

    $('#sceneDictSearch')?.addEventListener('input', (event) => {
      state.sceneDict.query = event.target.value;
      renderSceneDictionary();
    });

    $('#sceneDictList')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dict-speak]');
      if (!button) return;
      const word = wordMap.get(button.dataset.dictSpeak);
      if (word) speak(word.word, button);
    });

    $('#wordViewClose')?.addEventListener('click', hideWordViewCounter);

    $('#clickedToArchive').addEventListener('click', () => {
      closeModal($('#clickedModal'));
      $('#archive').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('#mobileWrongBtn').addEventListener('click', openWrongBook);
    $('#mobileMasteredBtn').addEventListener('click', openMasteredBook);

    $('#revealBtn').addEventListener('click', revealStudyAnswer);
    $('#prevCard').addEventListener('click', () => moveStudy(-1));
    $('#nextCard').addEventListener('click', () => moveStudy(1));
    $('#markLearnedBtn').addEventListener('click', () => markCurrentWord(true));
    $('#markAgainBtn').addEventListener('click', () => markCurrentWord(false));
    $('#restartRound').addEventListener('click', restartStudyRound);

    $('#studyScopes').addEventListener('click', (event) => {
      const scopeButton = event.target.closest('[data-scope]');
      if (scopeButton) setStudyScope(scopeButton.dataset.scope);
    });

    $('#fcAudio').addEventListener('click', () => {
      if (!state.study) return;
      const word = state.study.words[state.study.index];
      if (word) speak(word.word, $('#fcAudio'));
    });

    $('#fcExampleAudio').addEventListener('click', () => {
      if (!state.study) return;
      const word = state.study.words[state.study.index];
      if (word && word.example) speak(exampleSpeechText(word.example), $('#fcExampleAudio'));
    });

    document.addEventListener('click', (event) => {
      const closer = event.target.closest('[data-close]');
      if (!closer) return;
      const modal = closer.closest('.modal');
      if (modal) closeModal(modal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        trapFocus(event);
        return;
      }

      const modal = getOpenModal();

      if (event.key === 'Escape' && modal) {
        event.preventDefault();
        closeModal(modal);
        return;
      }

      if (
        event.key === '/' &&
        !modal &&
        !isFormField(document.activeElement) &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        $('#searchInput').focus();
        return;
      }

      if (
        modal?.id === 'archiveReaderModal' &&
        !isFormField(document.activeElement) &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
      ) {
        event.preventDefault();
        seekArchiveSpeech(event.key === 'ArrowLeft' ? -0.1 : 0.1);
        return;
      }

      if (modal?.id !== 'studyModal' || $('#studyBody').hidden) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveStudy(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveStudy(1);
        return;
      }

      if (event.key === ' ' && !isInteractive(event.target)) {
        event.preventDefault();
        if ($('#revealBtn').hidden) {
          moveStudy(1);
        } else {
          revealStudyAnswer();
        }
      }
    });

    const header = $('.site-header');
    window.addEventListener(
      'scroll',
      () => header.classList.toggle('is-scrolled', window.scrollY > 8),
      { passive: true }
    );

    window.addEventListener('focus', rolloverDay);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) rolloverDay();
    });
  }

  /* ── Start ─────────────────────────────────────────────── */

  loadProgress();
  loadArchive();
  bindEvents();
  renderAll();
  renderArchive();
})();
