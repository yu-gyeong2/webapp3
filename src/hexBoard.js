// 육각형 보드 시스템

export class HexBoard {
  constructor(width = 16, height = 10) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.initializeBoard();
  }

  initializeBoard() {
    // 빈 보드 생성
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = {
          x,
          y,
          resource: null,
          isEmpty: true,
          isStart: false,
          resourceCollected: false // 자원이 획득되었는지 여부
        };
      }
    }

    // 자원 타일 배치 (이미지에서 본 위치를 기반으로)
    this.placeResources();
  }

  placeResources() {
    // 시작 지점 정의 (각 플레이어 위치)
    const startPositions = [
      { x: 0, y: 0, player: 0 },   // 플레이어 1 - 상단 왼쪽
      { x: 15, y: 0, player: 1 }, // 플레이어 2 - 상단 오른쪽
      { x: 0, y: 9, player: 2 },  // 플레이어 3 - 하단 왼쪽
      { x: 15, y: 9, player: 3 } // 플레이어 4 - 하단 오른쪽
    ];

    // 각 시작 지점 주변에 자원을 공평하게 배치
    startPositions.forEach(start => {
      const { x, y } = start;
      
      // 각 시작 지점 주변에 자원 배치 (거리 2-5칸 내로 흩어서)
      // 플레이어 1 (상단 왼쪽)
      if (start.player === 0) {
        this.placeResourceAt([2, 1], '구리');
        this.placeResourceAt([1, 2], '목재');
        this.placeResourceAt([3, 1], '철');
        this.placeResourceAt([2, 2], '석탄');
        this.placeResourceAt([0, 3], '구리');
        this.placeResourceAt([4, 0], '목재');
        this.placeResourceAt([3, 2], '철');
        this.placeResourceAt([1, 3], 'U');
        this.placeResourceAt([4, 1], '구리');
        this.placeResourceAt([2, 3], '목재');
      }
      
      // 플레이어 2 (상단 오른쪽)
      if (start.player === 1) {
        this.placeResourceAt([13, 1], '구리');
        this.placeResourceAt([14, 2], '목재');
        this.placeResourceAt([12, 1], '철');
        this.placeResourceAt([13, 2], '석탄');
        this.placeResourceAt([15, 3], '구리');
        this.placeResourceAt([11, 0], '목재');
        this.placeResourceAt([12, 2], '철');
        this.placeResourceAt([14, 3], 'U');
        this.placeResourceAt([11, 1], '구리');
        this.placeResourceAt([13, 3], '목재');
      }
      
      // 플레이어 3 (하단 왼쪽)
      if (start.player === 2) {
        this.placeResourceAt([2, 8], '구리');
        this.placeResourceAt([1, 7], '목재');
        this.placeResourceAt([3, 8], '철');
        this.placeResourceAt([2, 7], '석탄');
        this.placeResourceAt([0, 6], '구리');
        this.placeResourceAt([4, 9], '목재');
        this.placeResourceAt([3, 7], '철');
        this.placeResourceAt([1, 6], 'U');
        this.placeResourceAt([4, 8], '구리');
        this.placeResourceAt([2, 6], '목재');
      }
      
      // 플레이어 4 (하단 오른쪽)
      if (start.player === 3) {
        this.placeResourceAt([13, 8], '구리');
        this.placeResourceAt([14, 7], '목재');
        this.placeResourceAt([12, 8], '철');
        this.placeResourceAt([13, 7], '석탄');
        this.placeResourceAt([15, 6], '구리');
        this.placeResourceAt([11, 9], '목재');
        this.placeResourceAt([12, 7], '철');
        this.placeResourceAt([14, 6], 'U');
        this.placeResourceAt([11, 8], '구리');
        this.placeResourceAt([13, 6], '목재');
      }
    });

    // 중앙 지역에도 자원 배치 (모든 플레이어가 접근 가능)
    // 탄소나노튜브를 가운데 4개 위치에 배치 (원래 구리 위치)
    const centerCarbonNanotube = [[7, 4], [8, 4], [7, 5], [8, 5]];
    const centerWood = [[6, 4], [9, 4], [6, 5], [9, 5]];
    const centerIron = [[5, 4], [10, 4], [5, 5], [10, 5]];
    const centerCoal = [[7, 3], [8, 3], [7, 6], [8, 6]];
    const centerUranium = [[6, 3], [9, 3], [6, 6], [9, 6]];
    const centerCopper = [[5, 3], [10, 3], [5, 6], [10, 6]]; // 구리를 다른 위치로 이동
    
    centerCarbonNanotube.forEach(([x, y]) => this.placeResourceAt([x, y], '탄소나노튜브'));
    centerWood.forEach(([x, y]) => this.placeResourceAt([x, y], '목재'));
    centerIron.forEach(([x, y]) => this.placeResourceAt([x, y], '철'));
    centerCoal.forEach(([x, y]) => this.placeResourceAt([x, y], '석탄'));
    centerUranium.forEach(([x, y]) => this.placeResourceAt([x, y], 'U'));
    centerCopper.forEach(([x, y]) => this.placeResourceAt([x, y], '구리'));

    // 시작 지점 설정
    startPositions.forEach(start => {
      const { x, y } = start;
      if (this.isValidPosition(x, y)) {
        this.tiles[y][x].isStart = true;
        this.tiles[y][x].isEmpty = false;
      }
    });
  }

  placeResourceAt([x, y], resourceType) {
    if (this.isValidPosition(x, y) && !this.tiles[y][x].isStart && !this.tiles[y][x].resource) {
      this.tiles[y][x].resource = resourceType;
      this.tiles[y][x].isEmpty = false;
      this.tiles[y][x].resourceCollected = false; // 초기값은 미획득
    }
  }
  
  // 자원 획득 처리
  collectResourceAt(x, y) {
    if (this.isValidPosition(x, y)) {
      const tile = this.tiles[y][x];
      // resourceCollected 속성이 없으면 false로 초기화
      if (tile.resourceCollected === undefined) {
        tile.resourceCollected = false;
      }
      if (tile.resource && !tile.resourceCollected) {
        tile.resourceCollected = true;
        return tile.resource;
      }
    }
    return null;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.tiles[y][x];
  }

  // 육각형 인접 타일 찾기 (offset 좌표계)
  // 육각형 보드에서 인접한 타일은 면(edge)으로 연결된 6개의 타일입니다
  // 렌더링 코드에서 x % 2를 사용하므로, 여기서도 x 좌표를 기준으로 합니다
  getNeighbors(x, y) {
    const neighbors = [];
    
    // offset 좌표계에서 열(x)이 짝수인지 홀수인지에 따라 인접 타일이 다릅니다
    // 짝수 열(x가 짝수) 기준 offset - "even-r" 좌표계
    const offsetsEven = [
      [1, 0],   // 동쪽 (오른쪽)
      [-1, 0],  // 서쪽 (왼쪽)
      [0, 1],   // 남쪽 (아래)
      [0, -1],  // 북쪽 (위)
      [1, 1],   // 남동쪽 (오른쪽 아래)
      [1, -1]   // 북동쪽 (오른쪽 위)
    ];
    
    // 홀수 열(x가 홀수) 기준 offset - "odd-r" 좌표계
    const offsetsOdd = [
      [1, 0],   // 동쪽 (오른쪽)
      [-1, 0],  // 서쪽 (왼쪽)
      [0, 1],   // 남쪽 (아래)
      [0, -1],  // 북쪽 (위)
      [-1, 1],  // 남서쪽 (왼쪽 아래)
      [-1, -1]  // 북서쪽 (왼쪽 위)
    ];

    // 열(x)이 짝수인지 홀수인지에 따라 offset 선택
    const offsets = x % 2 === 0 ? offsetsEven : offsetsOdd;

    offsets.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValidPosition(nx, ny)) {
        neighbors.push(this.tiles[ny][nx]);
      }
    });

    return neighbors;
  }

  // 거리 계산 (BFS)
  getReachableTiles(startX, startY, maxDistance) {
    const visited = new Set();
    const queue = [{ x: startX, y: startY, distance: 0 }];
    const reachable = [];

    while (queue.length > 0) {
      const { x, y, distance } = queue.shift();
      const key = `${x},${y}`;

      if (visited.has(key) || distance > maxDistance) continue;
      visited.add(key);

      if (distance > 0) {
        reachable.push({ x, y, distance });
      }

      if (distance < maxDistance) {
        const neighbors = this.getNeighbors(x, y);
        neighbors.forEach(tile => {
          const nKey = `${tile.x},${tile.y}`;
          if (!visited.has(nKey)) {
            queue.push({ x: tile.x, y: tile.y, distance: distance + 1 });
          }
        });
      }
    }

    return reachable;
  }
}

