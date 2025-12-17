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
    this.showCardAcquiredPopup = false; // 카드 획득 팝업 표시 여부
    this.acquiredCardName = null; // 획득한 카드 이름
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
      if (this.showCardAcquiredPopup) {
        this.setupCardAcquiredListener(); // 카드 획득 팝업 리스너
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
                ${(() => {
                  const availableResources = Object.entries(RESOURCE_TYPES).filter(([key]) => {
                    return (playerState.resources[key] || 0) > 0;
                  });
                  
                  if (availableResources.length === 0) {
                    return '<p style="color: #999; padding: 20px;">보유한 자원이 없습니다.</p>';
                  }
                  
                  return `
                    <div class="popup-resources-grid">
                      ${availableResources.map(([key, name]) => {
                        const count = playerState.resources[key] || 0;
                        return `
                          <div class="popup-resource-item resource-select-item ${this.selectedResourceForDouble === key ? 'selected' : ''}" data-resource="${key}">
                            <span class="popup-resource-name">${name}</span>
                            <span class="popup-resource-count">${count}개</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                })()}
              </div>
              <button id="confirm-resource-double" class="popup-close-btn" ${this.selectedResourceForDouble ? '' : 'disabled'}>확인</button>
            </div>
          </div>
        ` : ''}
        
        ${this.showTeleportPopup && !this.gameState.gameOver ? `
          <div class="turn-popup-modal">
            <div class="turn-popup-content">
              <h2>순간이동</h2>
              ${!this.teleportMode ? `
                <p>순간이동을 사용하시겠습니까?</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">확인 버튼을 누른 후 보드에서 원하는 위치를 클릭하세요</p>
                <button id="confirm-teleport-start" class="popup-close-btn">확인</button>
              ` : `
                <p>이동을 원하는 곳을 선택하세요:</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">보드에서 원하는 위치를 클릭하세요</p>
                <button id="cancel-teleport" class="popup-close-btn" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); margin-top: 10px;">취소</button>
              `}
            </div>
          </div>
        ` : ''}
        
        ${this.showCardAcquiredPopup && !this.gameState.gameOver ? `
          <div class="turn-popup-modal">
            <div class="turn-popup-content">
              <h2>카드 획득!</h2>
              <p style="font-size: 1.2em; color: #667eea; font-weight: bold; margin: 20px 0;">${this.acquiredCardName}</p>
              <p>카드를 성공적으로 획득했습니다!</p>
              <button id="confirm-card-acquired" class="popup-close-btn">확인</button>
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
            const count = playerState.resources[key] || 0;
            return `
              <div class="player-resource-item">
                <span class="resource-name-small">${name}</span>
                <span class="resource-count-small">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="player-cards">
          <div class="player-cards-header">획득 카드: <strong>${playerState.acquiredCards.length}</strong>개</div>
          ${playerState.acquiredCards.length > 0 ? `
            <div class="player-cards-list">
              ${playerState.acquiredCards.map(cardId => {
                const card = TECHNOLOGY_CARDS.find(c => c.id === cardId);
                return card ? `<div class="acquired-card-name">• ${card.name}</div>` : '';
              }).filter(Boolean).join('')}
            </div>
          ` : '<div class="no-cards">획득한 카드가 없습니다</div>'}
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
              // 자원 획득 후 팝업 업데이트 (자원 현황이 실시간 반영되도록)
              if (this.showTurnPopup) {
                // 팝업이 열려있으면 다시 렌더링하여 자원 현황 업데이트
                this.render();
              }
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
            
            // 카드 획득 팝업 표시
            this.showCardAcquiredPopup = true;
            this.acquiredCardName = cardData.name;
            this.render();
            
            // 카드 획득 팝업 리스너 설정
            setTimeout(() => {
              this.setupCardAcquiredListener();
            }, 0);
          } else {
            alert(result.message);
          }
        }
      });
    });
  }

  setupResourceSelectListeners() {
    // DOM이 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      // 자원 선택
      const resourceItems = document.querySelectorAll('.resource-select-item');
      
      if (resourceItems.length === 0) {
        console.warn('자원 선택 항목을 찾을 수 없습니다. 플레이어가 보유한 자원이 없을 수 있습니다.');
        return;
      }
      
      resourceItems.forEach(item => {
        // 기존 리스너 제거를 위해 클론
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', () => {
          const resourceKey = newItem.dataset.resource;
          this.selectedResourceForDouble = resourceKey;
          // 선택 상태 업데이트
          const allItems = document.querySelectorAll('.resource-select-item');
          allItems.forEach(i => i.classList.remove('selected'));
          newItem.classList.add('selected');
          // 확인 버튼 활성화
          const confirmBtn = document.getElementById('confirm-resource-double');
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
          }
        });
      });

      // 확인 버튼
      const confirmBtn = document.getElementById('confirm-resource-double');
      if (confirmBtn) {
        // 기존 리스너 제거를 위해 클론
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // 초기 상태 설정
        if (!this.selectedResourceForDouble) {
          newConfirmBtn.disabled = true;
          newConfirmBtn.style.opacity = '0.6';
          newConfirmBtn.style.cursor = 'not-allowed';
        }
        
        newConfirmBtn.addEventListener('click', () => {
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
      } else {
        console.warn('확인 버튼을 찾을 수 없습니다.');
      }
    }, 10);
  }

  setupCardAcquiredListener() {
    // DOM이 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      const confirmBtn = document.getElementById('confirm-card-acquired');
      if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', () => {
          this.showCardAcquiredPopup = false;
          this.acquiredCardName = null;
          
          // 특수 효과가 있으면 다음 팝업 표시
          const currentPlayerId = this.gameState.currentPlayer;
          const playerState = this.gameState.playerStates[currentPlayerId];
          const lastAcquiredCardId = playerState.acquiredCards[playerState.acquiredCards.length - 1];
          const lastCard = TECHNOLOGY_CARDS.find(c => c.id === lastAcquiredCardId);
          
          if (lastCard) {
            if (lastCard.effect.doubleResource) {
              this.showResourceSelectPopup = true;
              this.selectedResourceForDouble = null;
              this.render();
              setTimeout(() => {
                this.setupResourceSelectListeners();
              }, 0);
            } else if (lastCard.effect.teleport) {
              this.showTeleportPopup = true;
              this.teleportMode = false;
              this.render();
              this.setupTeleportListeners();
            } else {
              this.render();
            }
          } else {
            this.render();
          }
        });
      }
    }, 10);
  }

  setupTeleportListeners() {
    // DOM이 완전히 렌더링될 때까지 대기
    setTimeout(() => {
      // 순간이동 시작 확인 버튼
      const confirmStartBtn = document.getElementById('confirm-teleport-start');
      if (confirmStartBtn) {
        const newConfirmBtn = confirmStartBtn.cloneNode(true);
        confirmStartBtn.parentNode.replaceChild(newConfirmBtn, confirmStartBtn);
        
        newConfirmBtn.addEventListener('click', () => {
          // 순간이동 모드 활성화 (팝업은 유지하되 내용 변경)
          this.teleportMode = true;
          this.render();
          // 보드 이벤트 리스너 다시 설정
          this.setupBoardEventListeners();
        });
      }
      
      // 취소 버튼
      const cancelBtn = document.getElementById('cancel-teleport');
      if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', () => {
          this.showTeleportPopup = false;
          this.teleportMode = false;
          this.render();
        });
      }
    }, 10);
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

  async generatePDF() {
    // 게임 결과를 HTML로 생성
    const winner = this.gameState.players[this.gameState.winner];
    const currentDate = new Date().toLocaleDateString('ko-KR');
    
    // 결과 HTML 생성 (한글 폰트 명시적 지정)
    let resultHTML = `
      <div style="font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 14px;">
        <h1 style="text-align: center; color: #1e3c72; margin-bottom: 20px; font-family: 'Noto Sans KR', sans-serif;">기술 발달 게임 결과</h1>
        <p style="text-align: center; color: #666; margin-bottom: 10px; font-family: 'Noto Sans KR', sans-serif;">게임 날짜: ${currentDate}</p>
        <h2 style="text-align: center; color: #667eea; margin: 20px 0; font-family: 'Noto Sans KR', sans-serif;">승리자: ${winner.name}</h2>
        <div style="margin-top: 30px;">
          <h3 style="color: #1e3c72; border-bottom: 2px solid #667eea; padding-bottom: 10px; font-family: 'Noto Sans KR', sans-serif;">플레이어별 결과</h3>
    `;
    
    this.gameState.players.forEach((player, index) => {
      const playerState = this.gameState.playerStates[index];
      const isWinner = index === this.gameState.winner;
      
      resultHTML += `
        <div style="margin: 20px 0; padding: 15px; background: ${isWinner ? '#fff9e6' : '#f8f9fa'}; border-radius: 8px; border-left: 4px solid ${isWinner ? '#ffc107' : '#667eea'}; font-family: 'Noto Sans KR', sans-serif;">
          <h4 style="color: ${isWinner ? '#ff6b00' : '#1e3c72'}; margin: 0 0 10px 0; font-family: 'Noto Sans KR', sans-serif;">
            ${player.name}${isWinner ? ' (승리!)' : ''}
          </h4>
          <div style="margin: 8px 0; font-family: 'Noto Sans KR', sans-serif;">
            <strong>기술 점수:</strong> ${playerState.techScore}
          </div>
          <div style="margin: 8px 0; font-family: 'Noto Sans KR', sans-serif;">
            <strong>과학 점수:</strong> ${playerState.scienceScore}
          </div>
          <div style="margin: 8px 0; font-family: 'Noto Sans KR', sans-serif;">
            <strong>획득 카드 수:</strong> ${playerState.acquiredCards.length}개
          </div>
      `;
      
      if (playerState.acquiredCards.length > 0) {
        resultHTML += `
          <div style="margin: 8px 0; font-family: 'Noto Sans KR', sans-serif;">
            <strong>획득 카드:</strong>
            <ul style="margin: 5px 0; padding-left: 20px; font-family: 'Noto Sans KR', sans-serif;">
        `;
        playerState.acquiredCards.forEach(cardId => {
          const card = TECHNOLOGY_CARDS.find(c => c.id === cardId);
          if (card) {
            resultHTML += `<li style="font-family: 'Noto Sans KR', sans-serif;">${card.name}</li>`;
          }
        });
        resultHTML += `</ul></div>`;
      }
      
      const resources = Object.entries(RESOURCE_TYPES)
        .filter(([key]) => playerState.resources[key] > 0)
        .map(([key, name]) => `${name}: ${playerState.resources[key]}`)
        .join(', ');
      
      if (resources) {
        resultHTML += `
          <div style="margin: 8px 0; font-family: 'Noto Sans KR', sans-serif;">
            <strong>자원:</strong> ${resources}
          </div>
        `;
      }
      
      resultHTML += `</div>`;
    });
    
    resultHTML += `</div></div>`;
    
    // 임시 div 생성 및 HTML 삽입
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.fontFamily = "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif";
    tempDiv.innerHTML = resultHTML;
    document.body.appendChild(tempDiv);
    
    // 폰트 로드 대기 (한글 폰트가 제대로 렌더링되도록)
    await new Promise((resolve) => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          // 추가 대기 시간 (폰트 렌더링 완료 보장)
          setTimeout(resolve, 500);
        });
      } else {
        // 폰트 API가 없는 경우 기본 대기 시간
        setTimeout(resolve, 1000);
      }
    });
    
    try {
      // html2canvas를 사용하여 HTML을 이미지로 변환
      // html2canvas는 CDN에서 로드되므로 window 객체를 통해 접근
      if (typeof window.html2canvas === 'undefined') {
        alert('html2canvas 라이브러리가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        document.body.removeChild(tempDiv);
        return;
      }
      
      const canvas = await window.html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 클론된 문서에도 폰트 적용
          const clonedBody = clonedDoc.body;
          clonedBody.style.fontFamily = "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif";
        }
      });
      
      // jsPDF로 PDF 생성
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 너비 (mm)
      const pageHeight = 297; // A4 높이 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // 파일명 생성
      const fileName = `기술발달게임_결과_${currentDate.replace(/\//g, '-')}_${winner.name}.pdf`;
      
      // PDF 저장
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      // 임시 div 제거
      document.body.removeChild(tempDiv);
    }
  }
}

