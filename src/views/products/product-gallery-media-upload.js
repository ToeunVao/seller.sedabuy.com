import { Spin, Upload } from 'antd';
import { SUPPORTED_FORMATS } from 'configs/app-global';
import { useState } from 'react';
import galleryService from 'services/gallery';
import { PlusOutlined } from '@ant-design/icons';

// fileList format example:
// const fileList = [
//   {
//     uid: string,
//     name: string,
//     status: 'done', // done, uploading, error
//     url: string,
//     created: boolean,
//   },
// ]

export const ProductGalleryMediaUpload = ({
  type = 'stocks',
  fileList = [],
  onAdd,
  onRemove,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const handleRemove = (props) => {
    onRemove(props?.url);
  };
  const handleUpload = ({ file, onSuccess }) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    galleryService
      .upload(formData)
      .then((res) => {
        onSuccess('ok');
        onAdd(res?.data?.title);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };
  return (
    <Upload
      listType='picture-card'
      fileList={fileList}
      accept={SUPPORTED_FORMATS.join(',')}
      showUploadList
      customRequest={handleUpload}
      onRemove={handleRemove}
    >
      {isUploading ? <Spin /> : <PlusOutlined />}
    </Upload>
  );
};
