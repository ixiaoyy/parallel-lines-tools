import React, { useState } from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import { InitialValuesType } from './types';
import { analyzeHiddenCharacters } from './service';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';

const initialValues: InitialValuesType = {
  showUnicodeCodes: true,
  highlightRTL: true,
  showInvisibleChars: true,
  includeZeroWidthChars: true
};

export default function HiddenCharacterDetector({
  title,
  longDescription
}: ToolComponentProps) {
  const { t } = useTranslation(['string', 'translation']);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);

  const compute = (values: InitialValuesType, input: string) => {
    if (!input.trim()) return;

    try {
      const analysisResult = analyzeHiddenCharacters(input, values);
      setAnalysis(analysisResult);

      if (analysisResult.totalHiddenChars === 0) {
        setResult(t('hiddenCharacterDetector.noHiddenChars'));
      } else {
        let output = t('hiddenCharacterDetector.foundChars', {
          count: analysisResult.totalHiddenChars
        });

        analysisResult.hiddenCharacters.forEach((char: any) => {
          output += `${t('hiddenCharacterDetector.position')} ${
            char.position
          }: ${char.name} (${char.unicode})\n`;
          if (values.showUnicodeCodes) {
            output += `  ${t('hiddenCharacterDetector.unicode')}: ${
              char.unicode
            }\n`;
          }
          output += `  ${t('hiddenCharacterDetector.category')}: ${
            char.category
          }\n`;
          if (char.isRTL)
            output += `  ⚠️  ${t('hiddenCharacterDetector.rtlOverride')}\n`;
          if (char.isInvisible)
            output += `  👁️  ${t('hiddenCharacterDetector.invisibleChar')}\n`;
          if (char.isZeroWidth)
            output += `  📏  ${t('hiddenCharacterDetector.zeroWidthChar')}\n`;
          output += '\n';
        });

        if (analysisResult.hasRTLOverride) {
          output += `⚠️  ${t('hiddenCharacterDetector.rtlWarning')}\n`;
        }

        setResult(output);
      }
    } catch (error) {
      setResult(t('translation:common.error', { error: String(error) }));
    }
  };

  return (
    <ToolContent
      title={title}
      inputComponent={
        <Box>
          <ToolTextInput
            value={input}
            onChange={setInput}
            title={t('hiddenCharacterDetector.inputTitle')}
            placeholder={t('hiddenCharacterDetector.inputPlaceholder')}
          />

          {analysis && analysis.hasRTLOverride && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('hiddenCharacterDetector.rtlAlert')}
            </Alert>
          )}

          {analysis && analysis.totalHiddenChars > 0 && (
            <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fff3cd' }}>
              <Typography variant="h6" gutterBottom>
                {t('hiddenCharacterDetector.summary')}
              </Typography>
              <Typography variant="body2">
                {t('hiddenCharacterDetector.totalChars', {
                  count: analysis.totalHiddenChars
                })}
                {analysis.hasRTLOverride &&
                  ` • ${t('hiddenCharacterDetector.rtlFound')}`}
                {analysis.hasInvisibleChars &&
                  ` • ${t('hiddenCharacterDetector.invisibleFound')}`}
                {analysis.hasZeroWidthChars &&
                  ` • ${t('hiddenCharacterDetector.zeroWidthFound')}`}
              </Typography>
            </Paper>
          )}
        </Box>
      }
      resultComponent={<ToolTextResult value={result} />}
      initialValues={initialValues}
      getGroups={null}
      compute={compute}
      input={input}
      setInput={setInput}
      toolInfo={{
        title: t('hiddenCharacterDetector.aboutTitle', { title }),
        description:
          longDescription || t('hiddenCharacterDetector.aboutDescription')
      }}
    />
  );
}
