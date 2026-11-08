import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import ToolImageInput from 'components/input/ToolImageInput';
import CheckboxWithDesc from 'components/options/CheckboxWithDesc';
import ColorSelector from 'components/options/ColorSelector';
import TextFieldWithDesc from 'components/options/TextFieldWithDesc';
import ToolFileResult from 'components/result/ToolFileResult';
import Color from 'color';
import React, { useState } from 'react';
import { areColorsSimilar } from 'utils/color';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';

const initialValues = {
  enableTransparency: false,
  color: 'white',
  similarity: '10'
};

export default function ConvertJgpToPng({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);

  const compute = async (
    optionsValues: typeof initialValues,
    input: any
  ): Promise<void> => {
    if (!input) return;

    const processImage = async (
      file: File,
      transparencyTransform?: {
        color: [number, number, number];
        similarity: number;
      }
    ) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx == null) return;
      const img = new Image();

      img.src = URL.createObjectURL(file);
      await img.decode();

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (transparencyTransform) {
        const { color, similarity } = transparencyTransform;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data: Uint8ClampedArray = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const currentColor: [number, number, number] = [
            data[i],
            data[i + 1],
            data[i + 2]
          ];
          if (areColorsSimilar(currentColor, color, similarity)) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name, {
            type: 'image/png'
          });
          setResult(newFile);
        }
      }, 'image/png');
    };

    if (optionsValues.enableTransparency) {
      let rgb: [number, number, number];
      try {
        //@ts-ignore
        rgb = Color(optionsValues.color).rgb().array();
      } catch (err) {
        return;
      }

      processImage(input, {
        color: rgb,
        similarity: Number(optionsValues.similarity)
      });
    } else {
      processImage(input);
    }
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolImageInput
          value={input}
          onChange={setInput}
          accept={['image/jpeg']}
          title={inlineText('inline.inputJpg')}
        />
      }
      resultComponent={
        <ToolFileResult
          title={inlineText('inline.outputPng')}
          value={result}
          extension={'png'}
        />
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: inlineText('inline.pngTransparencyColor'),
          component: (
            <Box>
              <CheckboxWithDesc
                key="enableTransparency"
                title={inlineText('inline.enablePngTransparency')}
                checked={!!values.enableTransparency}
                onChange={(value) => updateField('enableTransparency', value)}
                description={inlineText('inline.makeTheColorBelowTransparent')}
              />
              <ColorSelector
                value={values.color}
                onColorChange={(val) => updateField('color', val)}
                description={inlineText(
                  'changeColors.toColor.selectorDescription'
                )}
                inputProps={{ 'data-testid': 'color-input' }}
              />
              <TextFieldWithDesc
                value={values.similarity}
                onOwnChange={(val) => updateField('similarity', val)}
                description={inlineText(
                  'inline.matchThisOfSimilarForExample10'
                )}
              />
            </Box>
          )
        }
      ]}
      compute={compute}
      setInput={setInput}
    />
  );
}
