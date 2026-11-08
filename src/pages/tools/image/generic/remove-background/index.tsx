import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import * as Yup from 'yup';
import ToolFileResult from '@components/result/ToolFileResult';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolImageInput from '@components/input/ToolImageInput';
import { removeBackground } from '@imgly/background-removal';
import * as heic2any from 'heic2any';

const initialValues = {};

const validationSchema = Yup.object({});

export default function RemoveBackgroundFromImage({
  title
}: ToolComponentProps) {
  // 仅本地化界面展示与校验提示；格式参数和处理流程保持原样。
  const { t: inlineText } = useInlineTranslation('image');

  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const compute = async (_optionsValues: typeof initialValues, input: any) => {
    if (!input) return;

    setIsProcessing(true);

    try {
      let fileToProcess = input;
      // Check if the file is HEIC (by MIME type or extension)
      if (
        input.type === 'image/heic' ||
        input.name?.toLowerCase().endsWith('.heic')
      ) {
        // Convert HEIC to PNG using heic2any
        const convertedBlob = await heic2any.default({
          blob: input,
          toType: 'image/png'
        });
        // heic2any returns a Blob or an array of Blobs
        let pngBlob;
        if (Array.isArray(convertedBlob)) {
          pngBlob = convertedBlob[0];
        } else {
          pngBlob = convertedBlob;
        }
        fileToProcess = new File(
          [pngBlob],
          input.name.replace(/\.[^/.]+$/, '') + '.png',
          { type: 'image/png' }
        );
      }

      // Convert the file to a Blob URL
      const inputUrl = URL.createObjectURL(fileToProcess);

      // Process the image with the background removal library
      const blob = await removeBackground(inputUrl, {
        progress: (progress) => {
          console.log(`Background removal progress: ${progress}`);
        }
      });

      // Create a new file from the blob
      const newFile = new File(
        [blob],
        fileToProcess.name.replace(/\.[^/.]+$/, '') + '-no-bg.png',
        {
          type: 'image/png'
        }
      );

      setResult(newFile);
    } catch (err) {
      console.error('Error removing background:', err);
      throw new Error(inlineText('inline.backgroundRemovalError'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={null}
      compute={compute}
      input={input}
      validationSchema={validationSchema}
      inputComponent={
        <ToolImageInput
          value={input}
          onChange={setInput}
          accept={['image/*']}
          title={inlineText('changeColors.inputTitle')}
        />
      }
      resultComponent={
        <ToolFileResult
          title={inlineText('inline.transparentPng')}
          value={result}
          extension={'png'}
          loading={isProcessing}
          loadingText={inlineText('inline.removingBackground')}
        />
      }
      toolInfo={{
        title: inlineText('removeBackground.title'),
        description: inlineText('inline.thisToolUsesAiToAutomaticallyRemove')
      }}
    />
  );
}
