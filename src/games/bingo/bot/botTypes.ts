import { BotDifficulty } from '../../../types';

export interface BotPersonality {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  difficulty: BotDifficulty;
}

export const PRESET_BOT_PERSONALITIES: BotPersonality[] = [
  {
    id: 'bot_robomonu',
    name: 'Robo Monu 🤖',
    nickname: 'Monu',
    avatar: '🤖',
    difficulty: 'NORMAL',
  },
  {
    id: 'bot_schoolbot',
    name: 'School Bot 🤖',
    nickname: 'Schoolie',
    avatar: '🎒',
    difficulty: 'EASY',
  },
  {
    id: 'bot_kunjunni',
    name: 'Kunjunni 🤖',
    nickname: 'Kunju',
    avatar: '🐘',
    difficulty: 'HARD',
  },
  {
    id: 'bot_bingochettan',
    name: 'Bingo Chettan 🤖',
    nickname: 'Chettan',
    avatar: '👑',
    difficulty: 'HARD',
  },
];
