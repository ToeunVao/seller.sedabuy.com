import { Image } from 'antd';

const ColumnImage = ({ image, id, size = 40, preview = true, style = {} }) => {
  return (
    <Image
      src={image || `https://placehold.co/${size}x${size}`}
      width={size}
      height={size}
      className='rounded'
      preview={preview && !!image}
      placeholder={!image}
      key={id ? `${image}_${id}` : image}
      style={{ objectFit: 'contain', ...style }}
    />
  );
};

export default ColumnImage;
