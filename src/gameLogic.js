import { TECHNOLOGY_CARDS, RESOURCE_TYPES, getCurrentPlayerState } from './gameData.js';

// 게임 로직 함수들

export function canAcquireCard(card, gameState) {
  const playerState = getCurrentPlayerState(gameState);
  
  // 발달조건 체크
  if (card.condition.techScore && playerState.techScore < card.condition.techScore) {
    return false;
  }
  if (card.condition.scienceScore && playerState.scienceScore < card.condition.scienceScore) {
    return false;
  }

  // 선행 기술 체크
  for (const prereqId of card.prerequisites) {
    if (!playerState.acquiredCards.includes(prereqId)) {
      return false;
    }
  }

  // 필요 자원 체크 (자원은 소모되지 않지만 조건은 만족해야 함)
  for (const [resource, amount] of Object.entries(card.resources)) {
    if (playerState.resources[resource] < amount) {
      return false;
    }
  }

  // 이미 획득한 카드인지 체크
  if (playerState.acquiredCards.includes(card.id)) {
    return false;
  }

  return true;
}

export function acquireCard(card, gameState) {
  // 이미 행동을 했으면 무시
  if (gameState.turnActionTaken) {
    return { success: false, message: '이미 이번 턴에 행동을 했습니다. 한 턴에 한 개의 카드만 획득할 수 있습니다.' };
  }

  if (!canAcquireCard(card, gameState)) {
    return { success: false, message: '카드를 획득할 수 없습니다.' };
  }

  const currentPlayerId = gameState.currentPlayer;
  const playerState = gameState.playerStates[currentPlayerId];
  
  // 자원은 소모하지 않음 - 자원 유지

  // 카드 효과 적용
  const updatedPlayerState = {
    ...playerState,
    resources: { ...playerState.resources }, // 자원 유지
    techScore: playerState.techScore, // 기술 점수 유지
    scienceScore: playerState.scienceScore, // 과학 점수 유지
    acquiredCards: [...playerState.acquiredCards, card.id]
  };

  if (card.effect.techScore) {
    updatedPlayerState.techScore += card.effect.techScore;
  }
  if (card.effect.scienceScore) {
    updatedPlayerState.scienceScore += card.effect.scienceScore;
  }
  if (card.effect.movementRange) {
    updatedPlayerState.movementRange = card.effect.movementRange;
  }

  // 플레이어 상태 업데이트
  const newPlayerStates = [...gameState.playerStates];
  newPlayerStates[currentPlayerId] = updatedPlayerState;

  const newState = {
    ...gameState,
    playerStates: newPlayerStates,
    turnActionTaken: true // 카드 획득 후 턴 행동 완료 표시
  };

  // 승리 조건 체크
  if (card.effect.win) {
    newState.gameOver = true;
    newState.winner = currentPlayerId;
  }

  return { success: true, newState };
}

export function increaseTechScore(gameState) {
  // 이미 행동을 했으면 무시
  if (gameState.turnActionTaken) {
    return gameState;
  }

  const currentPlayerId = gameState.currentPlayer;
  const playerState = gameState.playerStates[currentPlayerId];
  
  const newPlayerStates = [...gameState.playerStates];
  newPlayerStates[currentPlayerId] = {
    ...playerState,
    techScore: playerState.techScore + 1
  };

  const newState = {
    ...gameState,
    playerStates: newPlayerStates,
    turnActionTaken: true
  };

  // 팝업 표시를 위해 턴 전환은 하지 않고 상태만 반환
  return newState;
}

export function increaseScienceScore(gameState) {
  // 이미 행동을 했으면 무시
  if (gameState.turnActionTaken) {
    return gameState;
  }

  const currentPlayerId = gameState.currentPlayer;
  const playerState = gameState.playerStates[currentPlayerId];
  
  const newPlayerStates = [...gameState.playerStates];
  newPlayerStates[currentPlayerId] = {
    ...playerState,
    scienceScore: playerState.scienceScore + 1
  };

  const newState = {
    ...gameState,
    playerStates: newPlayerStates,
    turnActionTaken: true
  };

  // 팝업 표시를 위해 턴 전환은 하지 않고 상태만 반환
  return newState;
}

export function collectResource(resourceType, gameState) {
  const currentPlayerId = gameState.currentPlayer;
  const playerState = gameState.playerStates[currentPlayerId];
  
  const newPlayerStates = [...gameState.playerStates];
  newPlayerStates[currentPlayerId] = {
    ...playerState,
    resources: {
      ...playerState.resources,
      [resourceType]: playerState.resources[resourceType] + 1
    }
  };

  const newState = {
    ...gameState,
    playerStates: newPlayerStates,
    turnActionTaken: true
  };

  // 행동 후 자동으로 다음 턴으로
  return nextTurn(newState);
}

export function movePiece(pieceIndex, newPosition, gameState) {
  const newPieces = [...gameState.pieces];
  newPieces[pieceIndex] = {
    ...newPieces[pieceIndex],
    position: newPosition
  };

  return {
    ...gameState,
    pieces: newPieces
  };
}

export function nextTurn(gameState) {
  return {
    ...gameState,
    currentPlayer: (gameState.currentPlayer + 1) % 4,
    turnActionTaken: false // 새 턴 시작 시 행동 플래그 리셋
  };
}

// 행동 후 자동으로 다음 턴으로 넘어가는 함수
function performActionAndEndTurn(gameState) {
  const newState = {
    ...gameState,
    turnActionTaken: true
  };
  // 행동 후 자동으로 다음 턴으로
  return nextTurn(newState);
}

