import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../../../theme/theme';

export interface OPatternCandidate {
  type: 'row' | 'col';
  index: number;
  missingCellIndex: number;
  row: number;
  col: number;
  number: number;
}

interface OCandidateDisplayProps {
  candidates?: OPatternCandidate[];
  calledNumbers?: number[];
}

export const OCandidateDisplay: React.FC<OCandidateDisplayProps> = () => {
  return null;
};
