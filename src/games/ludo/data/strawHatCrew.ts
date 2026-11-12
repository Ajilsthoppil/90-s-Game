import { LudoColor } from '../types/ludo.types';

export interface StrawHatMember {
  id: string;
  name: string;
  shortName: string;
  title: string;
  role: string;
  avatar: string;
  defaultColor: LudoColor;
  quote: string;
  bounty: string;
}

export const STRAW_HAT_CREW: StrawHatMember[] = [
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    shortName: 'Luffy',
    title: 'Captain Luffy',
    role: 'Captain',
    avatar: '👒',
    defaultColor: 'RED',
    quote: "I'm gonna be King of the Pirates!",
    bounty: '3,000,000,000 Berries',
  },
  {
    id: 'zoro',
    name: 'Roronoa Zoro',
    shortName: 'Zoro',
    title: 'Swordsman Zoro',
    role: 'Swordsman',
    avatar: '⚔️',
    defaultColor: 'GREEN',
    quote: 'Nothing happened!',
    bounty: '1,111,000,000 Berries',
  },
  {
    id: 'nami',
    name: 'Nami',
    shortName: 'Nami',
    title: 'Navigator Nami',
    role: 'Navigator',
    avatar: '🍊',
    defaultColor: 'YELLOW',
    quote: 'Leave the weather and treasure to me!',
    bounty: '366,000,000 Berries',
  },
  {
    id: 'usopp',
    name: 'Usopp',
    shortName: 'Usopp',
    title: 'God Usopp',
    role: 'Sniper',
    avatar: '🎯',
    defaultColor: 'YELLOW',
    quote: 'I am the brave warrior of the sea!',
    bounty: '500,000,000 Berries',
  },
  {
    id: 'sanji',
    name: 'Sanji',
    shortName: 'Sanji',
    title: 'Cook Sanji',
    role: 'Cook',
    avatar: '🍳',
    defaultColor: 'YELLOW',
    quote: 'I will never kick a lady!',
    bounty: '1,032,000,000 Berries',
  },
  {
    id: 'chopper',
    name: 'Tony Tony Chopper',
    shortName: 'Chopper',
    title: 'Doctor Chopper',
    role: 'Doctor',
    avatar: '🌸',
    defaultColor: 'BLUE',
    quote: 'Calling me awesome won’t make me happy, bastard!',
    bounty: '1,000 Berries',
  },
  {
    id: 'robin',
    name: 'Nico Robin',
    shortName: 'Robin',
    title: 'Devil Child Robin',
    role: 'Archaeologist',
    avatar: '📚',
    defaultColor: 'BLUE',
    quote: 'I want to live! Take me with you!',
    bounty: '930,000,000 Berries',
  },
  {
    id: 'franky',
    name: 'Franky',
    shortName: 'Franky',
    title: 'Cyborg Franky',
    role: 'Shipwright',
    avatar: '🤖',
    defaultColor: 'BLUE',
    quote: 'SUUUUPER!',
    bounty: '394,000,000 Berries',
  },
  {
    id: 'brook',
    name: 'Brook',
    shortName: 'Brook',
    title: 'Soul King Brook',
    role: 'Musician',
    avatar: '🎻',
    defaultColor: 'GREEN',
    quote: 'Yo-ho-ho-ho! May I see your panties?',
    bounty: '383,000,000 Berries',
  },
  {
    id: 'jinbe',
    name: 'Jinbe',
    shortName: 'Jinbe',
    title: 'Knight of the Sea Jinbe',
    role: 'Helmsman',
    avatar: '🥋',
    defaultColor: 'BLUE',
    quote: 'I have pledged my loyalty to Luffy!',
    bounty: '1,100,000,000 Berries',
  },
];

export function getStrawHatMember(idOrShortName: string): StrawHatMember {
  const normalized = idOrShortName.toLowerCase();
  const found = STRAW_HAT_CREW.find(
    (m) => m.id.toLowerCase() === normalized || m.shortName.toLowerCase() === normalized
  );
  return found || STRAW_HAT_CREW[0];
}
