// 게임 UI 렌더링

import { HexBoard } from './hexBoard.js';
import { TECHNOLOGY_CARDS, RESOURCE_TYPES, createInitialGameState, getCurrentPlayerState } from './gameData.js';
import { 
  canAcquireCard, 
  acquireCard, 
  increaseTechScore, 
  increaseScienceScore,
  collectResource,
  movePiece,
  nextTurn
} from './gameLogic.js';

export class GameUI {
  constructor() {
    this.gameState = null;
    this.board = new HexBoard();
    this.selectedPiece = null;
    this.selectedTile = null;
    this.reachableTiles = [];
    this.showTurnPopup = true; // 턴 팝업 표시 여부
    this.popupTitle = null; // 팝업 제목 (null이면 기본 제목 사용)
    this.popupButtonText = null; // 팝업 버튼 텍스트 (null이면 기본 텍스트 사용)
    this.showResourceSelectPopup = false; // 자원 선택 팝업 표시 여부
    this.selectedResourceForDouble = null; // 2배로 만들 자원
    this.showTeleportPopup = false; // 순간이동 팝업 표시 여부
    this.teleportMode = false; // 순간이동 모드 활성화 여부
    this.gamePhase = 'nameInput'; // 'nameInput', 'tutorial', 'game'
    this.playerNames = ['', '', '', ''];
    this.init();
  }

  init() {
    this.render();
    if (this.gamePhase === 'nameInput') {
      this.setupNameInputListeners();
    } else if (this.gamePhase === 'tutorial') {
      this.setupTutorialListeners();
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    // 기술 점수 증가 버튼
    const techBtn = document.getElementById('increase-tech');
    if (techBtn) {
      techBtn.addEventListener('click', () => {
        if (!this.gameState.turnActionTaken) {
          this.gameState = increaseTechScore(this.gameState);
          this.selectedPiece = null;
          this.selectedTile = null;
          this.reachableTiles = [];
          // 점수 획득 후 팝업 표시
          const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
          this.popupTitle = `${currentPlayer.name} - 기술 점수 획득!`;
          this.popupButtonText = '다음 턴으로';
          this.showTurnPopup = true;
          this.render();
        }
      });
    }

    // 과학 점수 증가 버튼
    const scienceBtn = document.getElementById('increase-science');
    if (scienceBtn) {
      scienceBtn.addEventListener('click', () => {
        if (!this.gameState.turnActionTaken) {
          this.gameState = increaseScienceScore(this.gameState);
          this.selectedPiece = null;
          this.selectedTile = null;
          this.reachableTiles = [];
          // 점수 획득 후 팝업 표시
          const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
          this.popupTitle = `${currentPlayer.name} - 과학 점수 획득!`;
          this.popupButtonText = '다음 턴으로';
          this.showTurnPopup = true;
          this.render();
        }
      });
    }

    // 턴 종료 버튼 (행동 없이 턴 종료)
    const endTurnBtn = document.getElementById('end-turn');
    if (endTurnBtn) {
      endTurnBtn.addEventListener('click', () => {
        if (!this.gameState.turnActionTaken) {
          this.gameState = nextTurn(this.gameState);
          this.selectedPiece = null;
          this.selectedTile = null;
          this.reachableTiles = [];
          this.popupTitle = null; // 기본 제목으로 리셋
          this.popupButtonText = null; // 기본 버튼 텍스트로 리셋
          this.showTurnPopup = true; // 다음 턴 팝업 표시
          this.render();
        }
      });
    }
  }

  setupTurnPopupListener() {
    const closeBtn = document.getElementById('close-turn-popup');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // 행동 완료 후 팝업을 닫으면 다음 턴으로
        if (this.gameState.turnActionTaken) {
          this.gameState = nextTurn(this.gameState);
          this.popupTitle = null; // 기본 제목으로 리셋
          this.popupButtonText = null; // 기본 버튼 텍스트로 리셋
        }
        this.showTurnPopup = false;
        this.render();
      });
    }
  }

  render() {
    const app = document.getElementById('app');
    app.innerHTML = this.getHTML();
    
    // 게임 화면일 때만 보드 렌더링
    if (this.gamePhase === 'game') {
      this.renderBoard();
      this.renderScoreBoard();
      this.renderPlayersStatus();
      this.renderTechnologyCards();
      this.setupEventListeners(); // 이벤트 리스너 다시 바인딩
      this.setupBoardEventListeners();
      this.setupCardEventListeners();
      this.setupTurnPopupListener(); // 턴 팝업 리스너
      if (this.showResourceSelectPopup) {
        this.setupResourceSelectListeners(); // 자원 선택 팝업 리스너
      }
      if (this.showTeleportPopup) {
        this.setupTeleportListeners(); // 순간이동 팝업 리스너
      }
      if (this.gameState.gameOver) {
        this.setupPDFDownloadListener(); // PDF 다운로드 리스너
      }
    } else if (this.gamePhase === 'nameInput') {
      this.setupNameInputListeners();
    } else if (this.gamePhase === 'tutorial') {
      this.setupTutorialListeners();
    }
  }

  getHTML() {
    // 이름 입력 화면
    if (this.gamePhase === 'nameInput') {
      return `
        <div class="game-container">
          <div class="start-screen">
            <h1>기술 발달 게임</h1>
            <div class="name-input-section">
              <h2>플레이어 이름 입력</h2>
              <div class="name-inputs">
                ${[0, 1, 2, 3].map(i => `
                  <div class="name-input-group">
                    <label>플레이어 ${i + 1}:</label>
                    <input type="text" id="player-name-${i}" class="name-input" placeholder="이름을 입력하세요" value="${this.playerNames[i]}" maxlength="10">
                  </div>
                `).join('')}
              </div>
              <button id="start-game-btn" class="start-btn">게임 시작</button>
            </div>
          </div>
        </div>
      `;
    }
    
    // 튜토리얼 화면
    if (this.gamePhase === 'tutorial') {
      return `
        <div class="game-container">
          <div class="tutorial-screen">
            <h1>게임 튜토리얼</h1>
            <div class="tutorial-content">
              <div class="tutorial-section">
                <h2>게임 목표</h2>
                <p>기술 발달 카드를 획득하여 "우주여행시대도래" 카드를 획득하면 승리합니다!</p>
              </div>
              <div class="tutorial-section">
                <h2>게임 방법</h2>
                <ul>
                  <li>각 플레이어는 한 턴에 하나의 행동만 할 수 있습니다.</li>
                  <li>행동 종류: 기술 점수 +1, 과학 점수 +1, 말 이동하여 자원 획득</li>
                  <li>기술 발달 카드를 획득하려면 조건(기술/과학 점수, 선행기술, 자원)을 만족해야 합니다.</li>
                  <li>자원은 카드 획득 시 소모되지 않습니다.</li>
                  <li>기술 점수와 과학 점수는 계속 누적됩니다.</li>
                </ul>
              </div>
              <div class="tutorial-section">
                <h2>특수 효과</h2>
                <ul>
                  <li>컨베이어벨트: 자원 하나를 2배로 만들 수 있습니다.</li>
                  <li>메타버스: 순간이동으로 원하는 위치로 이동할 수 있습니다.</li>
                  <li>이동 범위 증가 카드: 이동 가능한 칸 수가 증가합니다.</li>
                </ul>
              </div>
              <button id="start-playing-btn" class="start-btn">확인</button>
            </div>
          </div>
        </div>
      `;
    }
    
    // 게임 화면
    if (this.gamePhase === 'game' && this.gameState) {
      const currentPlayer = this.gameState.players[this.gameState.currentPlayer];
      const playerState = getCurrentPlayerState(this.gameState);
      return `
      <div class="game-container">
        <div class="game-header">
          <h1>기술 발달 게임</h1>
          <div class="current-player">
            현재 플레이어: <span style="color: ${currentPlayer.color}">${currentPlayer.name}</span>
            <span class="turn-indicator">(턴 ${this.gameState.currentPlayer + 1}/4)</span>
          </div>
        </div>

        <div class="game-main">
          <div class="top-section">
            <div class="left-panel">
              <div class="score-board">
                <h2>점수</h2>
                <div class="score-row">
                  <div class="score-label">기술 점수</div>
                  <div class="score-value">${playerState.techScore}</div>
                  ${!this.gameState.turnActionTaken ? `
                    <button id="increase-tech" class="score-btn">+1</button>
                  ` : '<span class="disabled-text">완료</span>'}
                </div>
                <div class="score-row">
                  <div class="score-label">과학 점수</div>
                  <div class="score-value">${playerState.scienceScore}</div>
                  ${!this.gameState.turnActionTaken ? `
                    <button id="increase-science" class="score-btn">+1</button>
                  ` : '<span class="disabled-text">완료</span>'}
                </div>
              </div>
              <div class="action-panel">
                ${!this.gameState.turnActionTaken ? `
                  <button id="end-turn" class="action-btn">턴 종료 (행동 안함)</button>
                ` : `
                  <div class="turn-message">행동 완료! 다음 플레이어 차례입니다.</div>
                `}
              </div>
              <div class="technology-cards">
                <h2>기술 발달 카드</h2>
                <div class="cards-grid"></div>
              </div>
            </div>

            <div class="board-container">
              <div id="hex-board" class="hex-board"></div>
            </div>
          </div>

          <div class="bottom-section">
            <div class="players-status">
              <h2>플레이어 현황</h2>
              <div class="players-list"></div>
            </div>
          </div>
        </div>

        ${this.showTurnPopup && !this.gameState.gameOver ? `
          <div class="turn-popup-modal">
            <div class="turn-popup-content">
              <h2>${this.popupTitle || currentPlayer.name + '의 차례'}</h2>
              <div class="turn-popup-stats">
                <div class="popup-stat-row">
                  <span class="popup-label">기술 점수:</span>
                  <span class="popup-value">${playerState.techScore}</span>
                </div>
                <div class="popup-stat-row">
                  <span class="popup-label">과학 점수:</span>
                  <span class="popup-value">${playerState.scienceScore}</span>
                </div>
                <div class="popup-stat-row">
                  <span class="popup-label">획득 카드:</span>
                  <span class="popup-value">${playerState.acquiredCards.length}개</span>
                </div>
                <div class="popup-resources">
                  <div class="popup-label">자원:</div>
                  <div class="popup-resources-grid">
                    ${Object.entries(RESOURCE_TYPES).map(([key, name]) => `
                      <div class="popup-resource-item">
                        <span>${name}</span>
                        <span class="popup-resource-count">${playerState.resources[key] || 0}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <button id="close-turn-popup" class="popup-close-btn">${this.popupButtonText || '확인'}</button>
            </div>
          </div>
        ` : ''}
        
        ${this.showResourceSelectPopup && !this.gameState.gameOver ? `
          <div class="turn-popup-modal">
            <div class="turn-popup-content">
              <h2>자원 선택</h2>
              <p>2배로 만들 자원을 선택하세요:</p>
              <div class="popup-resources">
                <div class="popup-resources-grid">
                  ${Object.entries(RESOURCE_TYPES).map(([key, name]) => {
                    const count = playerState.resources[key] || 0;
                    if (count > 0) {
                      return `
                        <div class="popup-resource-item resource-select-item ${this.selectedResourceForDouble === key ? 'selected' : ''}" data-resource="${key}">
                          <span class="popup-resource-name">${name}</span>
                          <span class="popup-resource-count">${count}개</span>
                        </div>
                      `;
                    }
                    return '';
                  }).filter(Boolean).join('')}
                </div>
              </div>
              <button id="confirm-resource-double" class="popup-close-btn" ${this.selectedResourceForDouble ? '' : 'disabled'}>확인</button>
            </div>
          </div>
        ` : ''}
        
        ${this.showTeleportPopup && !this.gameState.gameOver ? `
          <div class="turn-popup-modal">
            <div class="turn-popup-content">
              <h2>순간이동</h2>
              <p>이동을 원하는 곳을 선택하세요:</p>
              <p style="font-size: 0.9em; color: #666; margin-top: 10px;">보드에서 원하는 위치를 클릭하세요</p>
            </div>
          </div>
        ` : ''}
        
        ${this.gameState.gameOver ? `
          <div class="game-over-modal">
            <div class="modal-content">
              <h2>게임 종료!</h2>
              <p>${currentPlayer.name} 승리!</p>
              <div class="game-result-summary">
                <h3>게임 결과</h3>
                <div class="result-players">
                  ${this.gameState.players.map((player, index) => {
                    const playerState = this.gameState.playerStates[index];
                    return `
                      <div class="result-player">
                        <strong>${player.name}</strong>
                        <div>기술 점수: ${playerState.techScore}</div>
                        <div>과학 점수: ${playerState.scienceScore}</div>
                        <div>획득 카드: ${playerState.acquiredCards.length}개</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              <button id="download-pdf-btn" class="pdf-download-btn">PDF로 저장하기</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    }
    
    // 기본값 (발생하지 않아야 함)
    return '';
  }

  renderBoard() {
    const boardEl = document.getElementById('hex-board');
    boardEl.innerHTML = '';

    // 육각형 크기를 이전 사이즈로 복원
    const hexSize = 40; // 이전 사이즈로 복원
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;

    this.board.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const hex = document.createElement('div');
        hex.className = 'hex-tile';
        
        const offsetX = x * hexWidth * 0.75;
        const offsetY = y * hexHeight + (x % 2) * hexHeight / 2;

        hex.style.left = `${offsetX}px`;
        hex.style.top = `${offsetY}px`;
        hex.style.width = `${hexWidth}px`;
        hex.style.height = `${hexHeight}px`;

        // 타일 스타일 설정
        if (tile.isStart) {
          hex.classList.add('start-tile');
        } else if (tile.resource) {
          hex.classList.add('resource-tile');
          hex.dataset.resource = tile.resource;
          hex.textContent = tile.resource;
          
          // 자원별 색상 (그라데이션 적용)
          const colors = {
            '구리': 'linear-gradient(135deg, #e57373 0%, #ef5350 100%)',
            '목재': 'linear-gradient(135deg, #ffb74d 0%, #ffa726 100%)',
            '철': 'linear-gradient(135deg, #b0bec5 0%, #90a4ae 100%)',
            '석탄': 'linear-gradient(135deg, #424242 0%, #212121 100%)',
            '탄소나노튜브': 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)',
            'U': 'linear-gradient(135deg, #fff176 0%, #ffeb3b 100%)'
          };
          hex.style.background = colors[tile.resource] || '#90EE90';
          // 자원별 테두리 색상 (얇고 반투명)
          const borderColors = {
            '구리': 'rgba(198, 40, 40, 0.4)',
            '목재': 'rgba(230, 81, 0, 0.4)',
            '철': 'rgba(66, 66, 66, 0.4)',
            '석탄': 'rgba(0, 0, 0, 0.5)',
            '탄소나노튜브': 'rgba(2, 119, 189, 0.4)',
            'U': 'rgba(245, 127, 23, 0.4)'
          };
          hex.style.borderColor = borderColors[tile.resource] || 'rgba(0, 0, 0, 0.3)';
        } else {
          hex.classList.add('empty-tile');
        }

        // 도달 가능한 타일 표시
        if (this.reachableTiles.some(t => t.x === x && t.y === y)) {
          hex.classList.add('reachable');
        }
        
        // 순간이동 모드일 때 모든 타일을 클릭 가능하게 표시
        if (this.teleportMode && this.showTeleportPopup) {
          hex.classList.add('reachable');
        }

        // 말 표시
        const piece = this.gameState.pieces.find(p => p.position && p.position.x === x && p.position.y === y);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          const playerColor = this.gameState.players[piece.playerId].color;
          pieceEl.style.backgroundColor = playerColor;
          pieceEl.title = `${this.gameState.players[piece.playerId].name}의 말`;
          hex.appendChild(pieceEl);
        }

        hex.dataset.x = x;
        hex.dataset.y = y;
        boardEl.appendChild(hex);
      });
    });

    const totalWidth = this.board.width * hexWidth * 0.75 + hexWidth;
    const totalHeight = this.board.height * hexHeight + hexHeight;
    
    boardEl.style.width = `${totalWidth}px`;
    boardEl.style.height = `${totalHeight}px`;
    boardEl.style.transform = 'none'; // 스케일링 제거, 원래 크기로 표시
    
    // 보드 컨테이너 크기를 보드 크기에 맞게 조정
    const container = boardEl.parentElement;
    if (container) {
      const containerHeight = totalHeight + 40; // 패딩 20px * 2
      container.style.width = `${totalWidth + 40}px`; // 패딩 20px * 2
      container.style.height = `${containerHeight}px`; // 패딩 20px * 2
      
      // 왼쪽 패널 높이도 보드 컨테이너와 동일하게 설정
      const leftPanel = document.querySelector('.left-panel');
      if (leftPanel) {
        leftPanel.style.height = `${containerHeight}px`;
      }
    }
  }

  renderScoreBoard() {
    // 점수 표시는 이미 HTML에 포함됨
  }

  renderResourcePanel() {
    const resourcesGrid = document.querySelector('.resources-grid');
    resourcesGrid.innerHTML = '';
    const playerState = getCurrentPlayerState(this.gameState);

    Object.entries(RESOURCE_TYPES).forEach(([key, name]) => {
      const resourceEl = document.createElement('div');
      resourceEl.className = 'resource-item';
      resourceEl.innerHTML = `
        <span class="resource-name">${name}</span>
        <span class="resource-count">${playerState.resources[name]}</span>
      `;
      resourcesGrid.appendChild(resourceEl);
    });
  }

  renderPlayersStatus() {
    const playersList = document.querySelector('.players-list');
    if (!playersList) return;
    
    playersList.innerHTML = '';

    this.gameState.players.forEach((player, index) => {
      const playerState = this.gameState.playerStates[index];
      const isCurrentPlayer = index === this.gameState.currentPlayer;
      
      const playerCard = document.createElement('div');
      playerCard.className = `player-card ${isCurrentPlayer ? 'current' : ''}`;
      
      playerCard.innerHTML = `
        <div class="player-header" style="border-left: 4px solid ${player.color}">
          <div class="player-name" style="color: ${player.color}">
            ${player.name}
            ${isCurrentPlayer ? '<span class="turn-badge">턴</span>' : ''}
          </div>
        </div>
        <div class="player-scores">
          <div class="player-score-item">
            <span class="score-label">기술</span>
            <span class="score-value">${playerState.techScore}</span>
          </div>
          <div class="player-score-item">
            <span class="score-label">과학</span>
            <span class="score-value">${playerState.scienceScore}</span>
          </div>
        </div>
        <div class="player-resources">
          ${Object.entries(RESOURCE_TYPES).map(([key, name]) => {
            const count = playerState.resources[name];
            return `
              <div class="player-resource-item">
                <span class="resource-name-small">${name}</span>
                <span class="resource-count-small">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="player-cards-count">
          획득 카드: <strong>${playerState.acquiredCards.length}</strong>개
        </div>
      `;
      
      playersList.appendChild(playerCard);
    });
  }

  renderTechnologyCards() {
    const cardsGrid = document.querySelector('.cards-grid');
    cardsGrid.innerHTML = '';
    const playerState = getCurrentPlayerState(this.gameState);

    TECHNOLOGY_CARDS.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'tech-card';
      
      const canAcquire = canAcquireCard(card, this.gameState);
      const isAcquired = playerState.acquiredCards.includes(card.id);

      if (isAcquired) {
        cardEl.classList.add('acquired');
      } else if (!canAcquire) {
        cardEl.classList.add('disabled');
      }

      // 선행기술 이름 가져오기
      const prerequisiteNames = card.prerequisites.map(prereqId => {
        const prereqCard = TECHNOLOGY_CARDS.find(c => c.id === prereqId);
        return prereqCard ? prereqCard.name : prereqId;
      });

      cardEl.innerHTML = `
        <div class="card-header">${card.name}</div>
        <div class="card-condition">
          ${card.condition.techScore ? `기술 ${card.condition.techScore}점` : ''}
          ${card.condition.scienceScore ? `과학 ${card.condition.scienceScore}점` : ''}
          ${prerequisiteNames.length > 0 ? `<div class="card-prerequisites">선행기술: ${prerequisiteNames.join(', ')}</div>` : ''}
        </div>
        <div class="card-resources">
          ${Object.entries(card.resources).map(([res, amt]) => `${res} ${amt}개`).join(', ') || '자원 없음'}
        </div>
        <div class="card-effect">
          ${this.getEffectText(card.effect)}
        </div>
      `;

      cardEl.dataset.cardId = card.id;
      cardsGrid.appendChild(cardEl);
    });
  }

  getEffectText(effect) {
    if (effect.win) return '승리!';
    if (effect.techScore) return `기술 +${effect.techScore}`;
    if (effect.scienceScore) return `과학 +${effect.scienceScore}`;
    if (effect.movementRange) return `이동 ${effect.movementRange}칸`;
    if (effect.doubleResource) return `자원 2배 (${effect.doubleResource}회)`;
    if (effect.teleport) return `순간이동 (${effect.teleport}회)`;
    return '';
  }

  setupBoardEventListeners() {
    const tiles = document.querySelectorAll('.hex-tile');
    tiles.forEach(tile => {
      tile.addEventListener('click', (e) => {
        const x = parseInt(tile.dataset.x);
        const y = parseInt(tile.dataset.y);

        // 순간이동 모드일 때
        if (this.teleportMode && this.showTeleportPopup) {
          const currentPlayerId = this.gameState.currentPlayer;
          const playerPiece = this.gameState.pieces.find(p => p.playerId === currentPlayerId);
          
          if (playerPiece) {
            const pieceIndex = this.gameState.pieces.indexOf(playerPiece);
            // 순간이동: 선택한 위치로 이동
            this.gameState = movePiece(pieceIndex, { x, y }, this.gameState);
            
            // 순간이동 완료
            this.showTeleportPopup = false;
            this.teleportMode = false;
            this.render();
          }
          return;
        }

        // 말 선택 (행동을 하지 않았을 때만)
        if (!this.gameState.turnActionTaken) {
          const piece = this.gameState.pieces.find(p => 
            p.position && p.position.x === x && p.position.y === y && 
            p.playerId === this.gameState.currentPlayer
          );

          if (piece) {
            const pieceIndex = this.gameState.pieces.indexOf(piece);
            this.selectedPiece = pieceIndex;
            const playerState = getCurrentPlayerState(this.gameState);
            this.reachableTiles = this.board.getReachableTiles(x, y, playerState.movementRange);
            console.log('말 선택:', { x, y, movementRange: playerState.movementRange, reachable: this.reachableTiles.length });
            this.render();
            return;
          }
        }

        // 타일 클릭 (이동 또는 자원 획득)
        if (this.selectedPiece !== null && !this.gameState.turnActionTaken) {
          const piece = this.gameState.pieces[this.selectedPiece];
          if (piece.playerId !== this.gameState.currentPlayer) {
            console.log('다른 플레이어의 말');
            return;
          }

          const isReachable = this.reachableTiles.some(t => t.x === x && t.y === y);
          console.log('이동 시도:', { x, y, isReachable, selectedPiece: this.selectedPiece, reachableTiles: this.reachableTiles.length });
          
          if (isReachable) {
            // 이동
            this.gameState = movePiece(this.selectedPiece, { x, y }, this.gameState);
            
            // 자원 획득 (자원 타일에서만)
            const tile = this.board.getTile(x, y);
            if (tile && tile.resource) {
              this.gameState = collectResource(tile.resource, this.gameState);
              // 자원 획득 후 팝업 표시 (collectResource가 자동으로 다음 턴으로 넘어감)
              this.popupTitle = null; // 기본 제목으로 리셋
              this.popupButtonText = null; // 기본 버튼 텍스트로 리셋
              this.showTurnPopup = true; // 다음 턴 팝업 표시
            } else {
              // 자원이 없는 타일로 이동한 경우에도 턴 종료
              this.gameState = {
                ...this.gameState,
                turnActionTaken: true
              };
              this.gameState = nextTurn(this.gameState);
              this.popupTitle = null; // 기본 제목으로 리셋
              this.popupButtonText = null; // 기본 버튼 텍스트로 리셋
              this.showTurnPopup = true; // 다음 턴 팝업 표시
            }

            this.selectedPiece = null;
            this.reachableTiles = [];
            this.render();
          } else {
            console.log('도달 불가능한 타일');
          }
        } else {
          // 시작 지점에 말 배치
          const tile = this.board.getTile(x, y);
          if (tile && tile.isStart) {
            const pieceIndex = this.gameState.pieces.findIndex(p => 
              p.playerId === this.gameState.currentPlayer && !p.position
            );
            if (pieceIndex !== -1) {
              this.gameState = movePiece(pieceIndex, { x, y }, this.gameState);
              this.render();
            }
          }
        }
      });
    });
  }

  setupCardEventListeners() {
    const cards = document.querySelectorAll('.tech-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        if (card.classList.contains('disabled') || card.classList.contains('acquired')) {
          return;
        }

        const cardId = card.dataset.cardId;
        const cardData = TECHNOLOGY_CARDS.find(c => c.id === cardId);
        
        if (cardData) {
          const result = acquireCard(cardData, this.gameState);
          if (result.success) {
            this.gameState = result.newState;
            
            // 자원 2배 효과가 있으면 팝업 표시
            if (cardData.effect.doubleResource) {
              this.showResourceSelectPopup = true;
              this.selectedResourceForDouble = null;
              this.render();
              this.setupResourceSelectListeners();
            } 
            // 순간이동 효과가 있으면 팝업 표시
            else if (cardData.effect.teleport) {
              this.showTeleportPopup = true;
              this.teleportMode = true;
              this.render();
              this.setupTeleportListeners();
            } else {
              this.render();
            }
          } else {
            alert(result.message);
          }
        }
      });
    });
  }

  setupResourceSelectListeners() {
    // 자원 선택
    const resourceItems = document.querySelectorAll('.resource-select-item');
    resourceItems.forEach(item => {
      item.addEventListener('click', () => {
        const resourceKey = item.dataset.resource;
        this.selectedResourceForDouble = resourceKey;
        // 선택 상태 업데이트
        resourceItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        // 확인 버튼 활성화
        const confirmBtn = document.getElementById('confirm-resource-double');
        if (confirmBtn) {
          confirmBtn.disabled = false;
        }
      });
    });

    // 확인 버튼
    const confirmBtn = document.getElementById('confirm-resource-double');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (this.selectedResourceForDouble) {
          // 선택한 자원을 2배로 만들기
          const currentPlayerId = this.gameState.currentPlayer;
          const playerState = this.gameState.playerStates[currentPlayerId];
          const currentCount = playerState.resources[this.selectedResourceForDouble] || 0;
          
          const newPlayerStates = [...this.gameState.playerStates];
          newPlayerStates[currentPlayerId] = {
            ...playerState,
            resources: {
              ...playerState.resources,
              [this.selectedResourceForDouble]: currentCount * 2
            }
          };

          this.gameState = {
            ...this.gameState,
            playerStates: newPlayerStates
          };

          this.showResourceSelectPopup = false;
          this.selectedResourceForDouble = null;
          this.render();
        }
      });
    }
  }

  setupTeleportListeners() {
    // 순간이동 팝업은 보드 클릭으로 처리되므로 여기서는 특별한 처리가 필요 없음
    // 보드의 모든 타일이 클릭 가능하도록 setupBoardEventListeners에서 처리됨
  }

  setupNameInputListeners() {
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // 이름 입력 확인
        const names = [];
        let allFilled = true;
        for (let i = 0; i < 4; i++) {
          const input = document.getElementById(`player-name-${i}`);
          const name = input ? input.value.trim() : '';
          if (!name) {
            allFilled = false;
            break;
          }
          names.push(name || `플레이어 ${i + 1}`);
        }
        
        if (!allFilled) {
          alert('모든 플레이어의 이름을 입력해주세요.');
          return;
        }
        
        // 이름 저장
        this.playerNames = names;
        
        // 튜토리얼 화면으로 이동
        this.gamePhase = 'tutorial';
        this.render();
      });
    }
    
    // Enter 키로 다음 입력으로 이동
    for (let i = 0; i < 4; i++) {
      const input = document.getElementById(`player-name-${i}`);
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            if (i < 3) {
              const nextInput = document.getElementById(`player-name-${i + 1}`);
              if (nextInput) nextInput.focus();
            } else {
              startBtn?.click();
            }
          }
        });
      }
    }
  }

  setupTutorialListeners() {
    const startBtn = document.getElementById('start-playing-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // 게임 상태 초기화 (이름 적용)
        this.gameState = createInitialGameState();
        // 플레이어 이름 적용
        this.gameState.players = this.gameState.players.map((player, index) => ({
          ...player,
          name: this.playerNames[index]
        }));
        
        // 게임 화면으로 이동
        this.gamePhase = 'game';
        this.render();
      });
    }
  }

  setupPDFDownloadListener() {
    const pdfBtn = document.getElementById('download-pdf-btn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        this.generatePDF();
      });
    }
  }

  generatePDF() {
    // jsPDF가 전역 객체로 로드됨
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const winner = this.gameState.players[this.gameState.winner];
    const currentDate = new Date().toLocaleDateString('ko-KR');
    
    // 제목
    doc.setFontSize(20);
    doc.text('기술 발달 게임 결과', 105, 20, { align: 'center' });
    
    // 날짜
    doc.setFontSize(12);
    doc.text(`게임 날짜: ${currentDate}`, 105, 30, { align: 'center' });
    
    // 승리자
    doc.setFontSize(16);
    doc.text(`승리자: ${winner.name}`, 105, 45, { align: 'center' });
    
    // 플레이어별 결과
    let yPos = 60;
    doc.setFontSize(14);
    doc.text('플레이어별 결과', 105, yPos, { align: 'center' });
    yPos += 10;
    
    this.gameState.players.forEach((player, index) => {
      const playerState = this.gameState.playerStates[index];
      const isWinner = index === this.gameState.winner;
      
      yPos += 10;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // 플레이어 이름 (승리자는 굵게)
      doc.setFontSize(12);
      if (isWinner) {
        doc.setFont(undefined, 'bold');
      }
      doc.text(`${player.name}${isWinner ? ' (승리!)' : ''}`, 20, yPos);
      doc.setFont(undefined, 'normal');
      
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`  기술 점수: ${playerState.techScore}`, 25, yPos);
      yPos += 6;
      doc.text(`  과학 점수: ${playerState.scienceScore}`, 25, yPos);
      yPos += 6;
      doc.text(`  획득 카드 수: ${playerState.acquiredCards.length}개`, 25, yPos);
      
      // 획득한 카드 목록
      if (playerState.acquiredCards.length > 0) {
        yPos += 6;
        doc.text(`  획득 카드:`, 25, yPos);
        yPos += 6;
        playerState.acquiredCards.forEach(cardId => {
          const card = TECHNOLOGY_CARDS.find(c => c.id === cardId);
          if (card) {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`    - ${card.name}`, 30, yPos);
            yPos += 5;
          }
        });
      }
      
      // 자원 현황
      yPos += 5;
      const resources = Object.entries(RESOURCE_TYPES)
        .filter(([key]) => playerState.resources[key] > 0)
        .map(([key, name]) => `${name}: ${playerState.resources[key]}`)
        .join(', ');
      if (resources) {
        doc.text(`  자원: ${resources}`, 25, yPos);
        yPos += 6;
      }
    });
    
    // 파일명 생성
    const fileName = `기술발달게임_결과_${currentDate.replace(/\//g, '-')}_${winner.name}.pdf`;
    
    // PDF 저장
    doc.save(fileName);
  }
}

