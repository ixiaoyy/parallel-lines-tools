import { useTranslation as useInlineTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { compareJson } from './service';
import { ToolComponentProps } from '@tools/defineTool';
import { Grid } from '@mui/material';

type InitialValuesType = {};

const initialValues: InitialValuesType = {};

export default function JsonComparison({ title }: ToolComponentProps) {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['json', 'translation']);

  const [input1, setInput1] = useState<string>('');
  const [input2, setInput2] = useState<string>('');
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const compareInputs = () => {
      try {
        // Only compare if at least one input has content
        if (input1.trim() || input2.trim()) {
          const differences = compareJson(
            input1 || '{}',
            input2 || '{}',
            'text'
          );
          setResult(differences);
        } else {
          setResult('');
        }
      } catch (error) {
        setResult(
          inlineText('translation:common.error', {
            error: String(
              error instanceof Error
                ? error.message
                : inlineText('inline.invalidJsonFormat')
            )
          })
        );
      }
    };

    compareInputs();
  }, [input1, input2, inlineText]);

  const handleInput1Change = (value: string | undefined) => {
    setInput1(value ?? '');
  };

  const handleInput2Change = (value: string) => {
    setInput2(value);
  };

  return (
    <ToolContent
      title={title}
      input={input1}
      setInput={setInput1}
      initialValues={initialValues}
      getGroups={null}
      compute={() => {}}
      inputComponent={
        <Grid container spacing={2}>
          <Grid item xs={12} md={6} lg={4}>
            <ToolCodeInput
              title={inlineText('inline.firstJson')}
              value={input1}
              onChange={handleInput1Change}
              language={'json'}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <ToolCodeInput
              title={inlineText('inline.secondJson')}
              language={'json'}
              value={input2}
              onChange={handleInput2Change}
            />
          </Grid>
          <Grid item xs={12} md={12} lg={4}>
            <ToolTextResult
              title={inlineText('inline.differences')}
              value={result}
              extension={'txt'}
            />
          </Grid>
        </Grid>
      }
    />
  );
}
