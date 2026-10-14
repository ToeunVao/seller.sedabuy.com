import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { IMG_URL } from '../configs/app-global';
import galleryService from '../services/gallery';
import { toast } from 'react-toastify';

export default function CkeEditor({ form, lang, languages }) {
  const { t } = useTranslation();

  function uploadAdapter(loader) {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          const formData = new FormData();
          loader.file.then((file) => {
            // FIX 1: The condition for checking if the file is AT LEAST 2MB was inverted.
            // The file size check should be for files LARGER than 2MB (2 * 1024 * 1024 bytes).
            // A file size greater than 2MB should trigger the error toast and rejection.
            const maxFileSizeMB = 2;
            const maxFileSizeInBytes = maxFileSizeMB * 1024 * 1024;
            const isFileTooLarge = file.size > maxFileSizeInBytes; // Check if size is greater than 2MB

            if (isFileTooLarge) {
              // The toast error message key 'min.2.mb' suggests a minimum size
              // requirement, but the logic seems to implement a maximum size check.
              // Assuming this is intended as a maximum size limit of 2MB for upload:
              toast.error(t('max.2.mb')); // You might want to use a more appropriate translation key like 'max.2.mb'
              reject({ message: t('max.2.mb') }); // Reject with an error message
              return; // Crucial: return to stop execution after rejection
            }
            
            formData.append('image', file);
            formData.append('type', 'blogs');
            galleryService
              .upload(formData)
              .then(({ data }) => {
                resolve({
                  default: `${IMG_URL + data.title}`,
                });
              })
              .catch((err) => {
                reject(err);
              });
          });
        });
      },
    };
  }

  function uploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return uploadAdapter(loader);
    };
  }

  return (
    <React.Fragment>
      {languages.map((item) => (
        <Form.Item
          key={'desc' + item.locale}
          label={t('description')}
          name={`description[${item.locale}]`}
          valuePropName='data'
          getValueFromEvent={(event, editor) => {
            const data = editor.getData();
            return data;
          }}
          rules={[
            {
              required: item.locale === lang,
              message: t('required'),
            },
            {
              validator(_, value) {
                // Check if the content is completely empty or only contains whitespace
                // CKEditor's getData() can return an empty string or content like '<p>&nbsp;</p>' or just a simple string.
                // Trimming is good, but for an empty editor, the value might be null or a minimal string.
                // Assuming value is the raw HTML string from the editor:
                if (!value || value.trim() === '') {
                   // This covers the case where the editor is empty or only has spaces.
                   // You might need a more robust check to ignore empty paragraph tags if your CKEditor setup doesn't clean them well on empty content.
                   if (item.locale === lang) {
                     return Promise.reject(new Error(t('required')));
                   }
                } else if (value.replace(/<[^>]*>?/gm, '').trim().length < 5) { // Strip HTML for length check
                  // Only validate length if it's the current language and a value exists
                  if (item.locale === lang) {
                    return Promise.reject(new Error(t('must.be.at.least.5')));
                  }
                }
                
                // If it's not the required language, or if validation passed:
                return Promise.resolve();
              },
            },
          ]}
          hidden={item.locale !== lang}
        >
          <CKEditor
            editor={ClassicEditor}
            config={{
              extraPlugins: [uploadPlugin],
            }}
            // FIX 2: Use `item.locale` instead of `item.value` for setting the field value
            // in the form, as `name` uses `item.locale`.
            onBlur={(event, editor) => {
              const data = editor.getData();
              form.setFieldsValue({
                [`description[${item.locale}]`]: data,
              });
            }}
          />
        </Form.Item>
      ))}
    </React.Fragment>
  );
}