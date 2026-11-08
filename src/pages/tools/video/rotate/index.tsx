import i18n from '../../../../i18n';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useCallback, useState } from 'react';
import * as Yup from 'yup';
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import { debounce } from 'lodash';
import ToolVideoInput from '@components/input/ToolVideoInput';
import { rotateVideo } from './service';
import SimpleRadio from '@components/options/SimpleRadio';
import { useTranslation } from 'react-i18next';
import { InitialValuesType, RotationAngle } from './types';

// 导出的校验器保留原有入口；校验发生时再按当前语言生成提示。
export const validationSchema = Yup.object({
  rotation: Yup.number()
    .oneOf([90, 180, 270], () => i18n.t('video:inline.rotationValues'))
    .required(() => i18n.t('video:inline.rotationIsRequired'))
});

export const initialValues: InitialValuesType = {
  rotation: 90
};

export default function RotateVideo({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('video');

  const angleOptions: { value: RotationAngle; label: string }[] = [
    { value: 90, label: inlineText('rotate.90Degrees') },
    { value: 180, label: inlineText('rotate.180Degrees') },
    { value: 270, label: inlineText('rotate.270Degrees') }
  ];

  const { t } = useTranslation('video');
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async (
    optionsValues: InitialValuesType,
    input: File | null
  ) => {
    if (!input) return;
    setLoading(true);

    try {
      const rotatedFile = await rotateVideo(input, optionsValues);
      setResult(rotatedFile);
    } catch (error) {
      console.error('Error rotating video:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedCompute = useCallback(debounce(compute, 1000), []);

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('rotate.rotation'),
      component: (
        <Box>
          {angleOptions.map((angleOption) => (
            <SimpleRadio
              key={angleOption.value}
              title={t(`rotate.${angleOption.value}Degrees`)}
              checked={values.rotation === angleOption.value}
              onClick={() => {
                updateField('rotation', angleOption.value);
              }}
            />
          ))}
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolVideoInput
          value={input}
          onChange={setInput}
          title={t('rotate.inputTitle')}
        />
      }
      resultComponent={
        <ToolFileResult
          title={t('rotate.resultTitle')}
          loading={loading}
          value={result}
          extension={'mp4'}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      compute={debouncedCompute}
      setInput={setInput}
      validationSchema={validationSchema}
    />
  );
}
