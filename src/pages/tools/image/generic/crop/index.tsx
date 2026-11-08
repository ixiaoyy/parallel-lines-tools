import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import * as Yup from 'yup';
import ToolImageInput from '@components/input/ToolImageInput';
import ToolFileResult from '@components/result/ToolFileResult';
import { GetGroupsType, UpdateField } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import SimpleRadio from '@components/options/SimpleRadio';

const initialValues = {
  xPosition: '0',
  yPosition: '0',
  cropWidth: '100',
  cropHeight: '100',
  cropShape: 'rectangular' as 'rectangular' | 'circular'
};
type InitialValuesType = typeof initialValues;

export default function CropImage({ title }: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');
  const validationSchema = Yup.object({
    xPosition: Yup.number()
      .min(0, inlineText('inline.xPositionMustBePositive'))
      .required(inlineText('inline.xPositionIsRequired')),
    yPosition: Yup.number()
      .min(0, inlineText('inline.yPositionMustBePositive'))
      .required(inlineText('inline.yPositionIsRequired')),
    cropWidth: Yup.number()
      .min(1, inlineText('inline.widthMustBeAtLeast1px'))
      .required(inlineText('inline.widthIsRequired')),
    cropHeight: Yup.number()
      .min(1, inlineText('inline.heightMustBeAtLeast1px'))
      .required(inlineText('inline.heightIsRequired'))
  });

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);

  const compute = (optionsValues: InitialValuesType, input: any) => {
    if (!input) return;

    const { xPosition, yPosition, cropWidth, cropHeight, cropShape } =
      optionsValues;
    const x = parseInt(xPosition);
    const y = parseInt(yPosition);
    const width = parseInt(cropWidth);
    const height = parseInt(cropHeight);
    const isCircular = cropShape === 'circular';

    const processImage = async (
      file: File,
      x: number,
      y: number,
      width: number,
      height: number,
      isCircular: boolean
    ) => {
      // Create source canvas
      const sourceCanvas = document.createElement('canvas');
      const sourceCtx = sourceCanvas.getContext('2d');
      if (sourceCtx == null) return;

      // Create destination canvas
      const destCanvas = document.createElement('canvas');
      const destCtx = destCanvas.getContext('2d');
      if (destCtx == null) return;

      // Load image
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      // Set source canvas dimensions
      sourceCanvas.width = img.width;
      sourceCanvas.height = img.height;

      // Draw original image on source canvas
      sourceCtx.drawImage(img, 0, 0);

      // Set destination canvas dimensions to crop size
      destCanvas.width = width;
      destCanvas.height = height;

      if (isCircular) {
        // For circular crop
        destCtx.beginPath();
        // Create a circle with center at half width/height and radius of half the smaller dimension
        const radius = Math.min(width, height) / 2;
        destCtx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
        destCtx.closePath();
        destCtx.clip();

        // Draw the cropped portion centered in the circle
        destCtx.drawImage(img, x, y, width, height, 0, 0, width, height);
      } else {
        // For rectangular crop, simply draw the specified region
        destCtx.drawImage(img, x, y, width, height, 0, 0, width, height);
      }

      // Convert canvas to blob and create file
      destCanvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], file.name, {
            type: file.type
          });
          setResult(newFile);
        }
      }, file.type);
    };

    processImage(input, x, y, width, height, isCircular);
  };
  const handleCropChange =
    (values: InitialValuesType, updateField: UpdateField<InitialValuesType>) =>
    (
      position: { x: number; y: number },
      size: { width: number; height: number }
    ) => {
      updateField('xPosition', position.x.toString());
      updateField('yPosition', position.y.toString());
      updateField('cropWidth', size.width.toString());
      updateField('cropHeight', size.height.toString());
    };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.cropPositionAndSize'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.xPosition}
            onOwnChange={(val) => updateField('xPosition', val)}
            description={inlineText('inline.xPositionInPixels')}
            inputProps={{
              'data-testid': 'x-position-input',
              type: 'number',
              min: 0
            }}
          />
          <TextFieldWithDesc
            value={values.yPosition}
            onOwnChange={(val) => updateField('yPosition', val)}
            description={inlineText('inline.yPositionInPixels')}
            inputProps={{
              'data-testid': 'y-position-input',
              type: 'number',
              min: 0
            }}
          />
          <TextFieldWithDesc
            value={values.cropWidth}
            onOwnChange={(val) => updateField('cropWidth', val)}
            description={inlineText('inline.cropWidthInPixels')}
            inputProps={{
              'data-testid': 'crop-width-input',
              type: 'number',
              min: 1
            }}
          />
          <TextFieldWithDesc
            value={values.cropHeight}
            onOwnChange={(val) => updateField('cropHeight', val)}
            description={inlineText('inline.cropHeightInPixels')}
            inputProps={{
              'data-testid': 'crop-height-input',
              type: 'number',
              min: 1
            }}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.cropShape'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('cropShape', 'rectangular')}
            checked={values.cropShape == 'rectangular'}
            description={inlineText(
              'inline.cropARectangularFragmentFromAnImage'
            )}
            title={inlineText('inline.rectangularCropShape')}
          />
          <SimpleRadio
            onClick={() => updateField('cropShape', 'circular')}
            checked={values.cropShape == 'circular'}
            description={inlineText('inline.cropACircularFragmentFromAnImage')}
            title={inlineText('inline.circularCropShape')}
          />
        </Box>
      )
    }
  ];
  const renderCustomInput = (
    values: InitialValuesType,
    updateField: UpdateField<InitialValuesType>
  ) => (
    <ToolImageInput
      value={input}
      onChange={setInput}
      accept={['image/*']}
      title={inlineText('changeColors.inputTitle')}
      showCropOverlay={!!input}
      cropShape={values.cropShape as 'rectangular' | 'circular'}
      cropPosition={{
        x: parseInt(values.xPosition || '0'),
        y: parseInt(values.yPosition || '0')
      }}
      cropSize={{
        width: parseInt(values.cropWidth || '100'),
        height: parseInt(values.cropHeight || '100')
      }}
      onCropChange={handleCropChange(values, updateField)}
    />
  );
  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      validationSchema={validationSchema}
      renderCustomInput={renderCustomInput}
      resultComponent={
        <ToolFileResult title={inlineText('crop.resultTitle')} value={result} />
      }
      toolInfo={{
        title: inlineText('crop.title'),
        description: inlineText('inline.thisToolAllowsYouToCropAn')
      }}
    />
  );
}
