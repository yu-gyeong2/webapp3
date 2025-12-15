// 게임 데이터 및 상수 정의

// 자원 타입
export const RESOURCE_TYPES = {
  COPPER: '구리',
  WOOD: '목재',
  IRON: '철',
  COAL: '석탄',
  CARBON_NANOTUBE: '탄소나노튜브',
  URANIUM: 'U'
};

// 기술 발달 카드 데이터
export const TECHNOLOGY_CARDS = [
  // Row 1
  {
    id: 'steam-engine',
    name: '증기기관 발명',
    condition: { techScore: 2 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.IRON]: 1, [RESOURCE_TYPES.COAL]: 1 },
    effect: { techScore: 1 }
  },
  {
    id: 'steam-locomotive',
    name: '증기기관차 발명',
    condition: { techScore: 3 },
    prerequisites: ['steam-engine'],
    resources: { [RESOURCE_TYPES.IRON]: 1, [RESOURCE_TYPES.COAL]: 2 },
    effect: { movementRange: 3 }
  },
  {
    id: 'electricity',
    name: '전기 발견',
    condition: { scienceScore: 1 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.COPPER]: 1 },
    effect: { scienceScore: 1 }
  },
  {
    id: 'power-plant',
    name: '발전소 건설',
    condition: { techScore: 4 },
    prerequisites: ['electricity'],
    resources: { [RESOURCE_TYPES.COAL]: 2 },
    effect: { movementRange: 3 }
  },
  // Row 2
  {
    id: 'conveyor-belt',
    name: '컨베이어벨트 도입',
    condition: { techScore: 4 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.IRON]: 1 },
    effect: { doubleResource: 1 }
  },
  {
    id: 'telephone',
    name: '전화기 발명',
    condition: { scienceScore: 3 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.COPPER]: 1 },
    effect: {}
  },
  {
    id: 'automobile',
    name: '자동차 발명',
    condition: { techScore: 5 },
    prerequisites: ['conveyor-belt'],
    resources: { [RESOURCE_TYPES.COPPER]: 2 },
    effect: { movementRange: 4 }
  },
  {
    id: 'nuclear-physics',
    name: '핵 물리학 발전',
    condition: { techScore: 5, scienceScore: 2 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.URANIUM]: 1 },
    effect: {}
  },
  // Row 3
  {
    id: 'internet',
    name: '인터넷 혁명',
    condition: { scienceScore: 4 },
    prerequisites: ['electricity'],
    resources: {},
    effect: { techScore: 4 }
  },
  {
    id: 'smartphone',
    name: '스마트폰 발명',
    condition: { techScore: 6 },
    prerequisites: ['telephone'],
    resources: {},
    effect: {}
  },
  {
    id: 'robot-tech',
    name: '로봇 기술',
    condition: { techScore: 7 },
    prerequisites: [],
    resources: { [RESOURCE_TYPES.IRON]: 3 },
    effect: {}
  },
  {
    id: 'smart-farm',
    name: '스마트팜 개발',
    condition: { techScore: 7 },
    prerequisites: ['internet'],
    resources: { [RESOURCE_TYPES.WOOD]: 2 },
    effect: {}
  },
  // Row 4
  {
    id: 'metaverse',
    name: '메타버스',
    condition: { techScore: 8 },
    prerequisites: [],
    resources: {},
    effect: { teleport: 1 }
  },
  {
    id: 'ai-research',
    name: '인공지능 연구',
    condition: { techScore: 9 },
    prerequisites: ['robot-tech'],
    resources: {},
    effect: {}
  },
  {
    id: 'space-rocket',
    name: '우주 로켓 개발',
    condition: { techScore: 10 },
    prerequisites: ['nuclear-physics'],
    resources: {},
    effect: { movementRange: 7 }
  },
  {
    id: 'space-travel',
    name: '우주여행시대도래',
    condition: {},
    prerequisites: ['space-rocket', 'smart-farm', 'ai-research'],
    resources: { [RESOURCE_TYPES.CARBON_NANOTUBE]: 1 },
    effect: { win: true }
  }
];

// 게임 초기 상태
export function createInitialGameState() {
  const players = [
    { id: 0, name: '플레이어 1', color: '#FF6B6B' },
    { id: 1, name: '플레이어 2', color: '#4ECDC4' },
    { id: 2, name: '플레이어 3', color: '#FFE66D' },
    { id: 3, name: '플레이어 4', color: '#95E1D3' }
  ];

  // 각 플레이어별 초기 상태
  const playerStates = players.map(player => ({
    playerId: player.id,
    resources: {
      [RESOURCE_TYPES.COPPER]: 0,
      [RESOURCE_TYPES.WOOD]: 0,
      [RESOURCE_TYPES.IRON]: 0,
      [RESOURCE_TYPES.COAL]: 0,
      [RESOURCE_TYPES.CARBON_NANOTUBE]: 0,
      [RESOURCE_TYPES.URANIUM]: 0
    },
    techScore: 0,
    scienceScore: 0,
    movementRange: 1,
    acquiredCards: []
  }));

  // 시작 지점 위치 (4개 모서리)
  const startPositions = [
    { x: 0, y: 0 },   // 플레이어 1 - 상단 왼쪽
    { x: 15, y: 0 },  // 플레이어 2 - 상단 오른쪽
    { x: 0, y: 9 },   // 플레이어 3 - 하단 왼쪽
    { x: 15, y: 9 }   // 플레이어 4 - 하단 오른쪽
  ];

  return {
    currentPlayer: 0,
    turnActionTaken: false, // 이번 턴에 행동을 했는지 여부
    players,
    pieces: [
      { playerId: 0, position: startPositions[0] },
      { playerId: 1, position: startPositions[1] },
      { playerId: 2, position: startPositions[2] },
      { playerId: 3, position: startPositions[3] }
    ],
    playerStates, // 각 플레이어의 상태
    gameOver: false,
    winner: null
  };
}

// 현재 플레이어의 상태 가져오기
export function getCurrentPlayerState(gameState) {
  return gameState.playerStates[gameState.currentPlayer];
}

