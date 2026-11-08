import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { useState, useCallback } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import { loopAudio } from './service';
import { InitialValuesType } from './types';
import ToolAudioInput from '@components/input/ToolAudioInput';
import ToolFileResult from '@components/result/ToolFileResult';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { updateNumberField } from '@utils/string';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { getFileExtension } from '@utils/file';

const initialValues: InitialValuesType = {
  loops: 2
};

export default function Loop({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('audio');
  const validationSchema = Yup.object({
    loops: Yup.number().min(
      1,
      inlineText('inline.numberOfLoopsMustBeGreaterThan')
    )
  });

  const { t } = useTranslation('audio');
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async (values: InitialValuesType, input: File | null) => {
    if (!input) return;
    try {
      setLoading(true);
      const resultFile = await loopAudio(input, values);
      setResult(resultFile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedCompute = useCallback(debounce(compute, 1000), []);

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: t('loop.loops'),
      component: (
        <Box>
          <TextFieldWithDesc
            onOwnChange={(value) =>
              updateNumberField(
                String(Math.max(1, Number(value) || 1)),
                'loops',
                updateField
              )
            }
            value={values.loops}
            label={t('loop.numberOfLoops')}
            type="number"
            inputProps={{
              min: 1
            }}
          />
        </Box>
      )
    }
  ];
  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={<ToolAudioInput value={input} onChange={setInput} />}
      resultComponent={
        <ToolFileResult
          value={result}
          title={t('loop.resultTitle')}
          loading={loading}
          extension={result ? getFileExtension(result.name) : 'mp3'}
        />
      }
      initialValues={initialValues}
      validationSchema={validationSchema}
      getGroups={getGroups}
      setInput={setInput}
      compute={debouncedCompute}
      toolInfo={{
        title: t('loop.toolInfo.title', { title }),
        description: t('loop.toolInfo.description')
      }}
    />
  );
}
