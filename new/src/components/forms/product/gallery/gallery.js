import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Badge, Button, Col, Divider, Row, Space, Spin } from 'antd';
import { CustomCard } from 'components/custom-card';
import { GetColorName } from 'hex-color-to-color-name';
import { ProductGalleryMediaUpload } from './image-upload';

export const ProductStocksGallery = ({
  data,
  isLoading = false,
  onSubmit,
  onPrevPage,
  onNextPage,
}) => {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupedColorStocks, setGroupedColorStocks] = useState([]);

  const createImage = (file) => ({
    uid: file,
    name: file,
    status: 'done', // done, uploading, error
    url: file,
    created: true,
  });
  // type: add, remove
  const handleChange = ({ type = 'add', extraValueId, image }) => {
    switch (type) {
      case 'add':
        setGroupedColorStocks((prev) =>
          prev?.map((item) =>
            item?.value?.id === extraValueId
              ? {
                  ...(item || {}),
                  images: [...item?.images, createImage(image)],
                }
              : item,
          ),
        );
        break;
      case 'remove':
        setGroupedColorStocks((prev) =>
          prev?.map((item) =>
            item?.value?.id === extraValueId
              ? {
                  ...(item || {}),
                  images: item?.images?.filter((i) => i?.url !== image),
                }
              : item,
          ),
        );
        break;
      default:
        break;
    }
  };

  const onFinish = () => {
    setIsSubmitting(true);
    if (!groupedColorStocks?.length) {
      onNextPage();
      return;
    }
    setIsSubmitting(true);
    const body = data?.stocks?.map((stock) => {
      const bodyItem = { id: stock?.id, images: [] };
      const existingIndex = groupedColorStocks.findIndex(
        (groupedColorStock) => groupedColorStock?.stock_id === stock?.id,
      );
      if (existingIndex > -1) {
        bodyItem.images =
          groupedColorStocks[existingIndex]?.images?.map((img) => img?.url) ||
          [];
      }
      return bodyItem;
    });
    onSubmit(body)
      .then(() => {
        onNextPage();
      })
      .finally((res) => {
        setIsSubmitting(false);
        return res;
      });
  };

  useEffect(() => {
    const newGroupedColorStocks = [];
    data?.stocks?.forEach((stock) => {
      stock?.extras?.forEach((extra) => {
        if (extra?.group?.type === 'color') {
          const existingIndex = newGroupedColorStocks.findIndex(
            (groupedColorStock) =>
              groupedColorStock?.value?.id === extra?.value?.id,
          );
          if (existingIndex > -1) {
            newGroupedColorStocks[existingIndex].galleries = [
              ...(newGroupedColorStocks[existingIndex].galleries || []),
              ...(stock?.galleries || []),
            ];
            newGroupedColorStocks[existingIndex].images = [
              ...(newGroupedColorStocks[existingIndex].images || []),
              ...(stock?.galleries?.map((gallery) =>
                createImage(gallery?.path),
              ) || []),
            ];
          } else {
            newGroupedColorStocks.push({
              group: extra?.group,
              value: extra?.value,
              galleries: stock?.galleries || [],
              stock_id: stock?.id,
              images:
                stock?.galleries?.map((gallery) =>
                  createImage(gallery?.path),
                ) || [],
            });
          }
        }
      });
    });
    setGroupedColorStocks(newGroupedColorStocks);
  }, [data]);

  return (
    <>
      <Spin spinning={isLoading}>
        <Row gutter={[24, 24]}>
          {groupedColorStocks?.map((groupedColorStock) => (
            <Col key={groupedColorStock?.value?.id} span={24}>
              <CustomCard
                extra={
                  <Badge
                    color={groupedColorStock?.value?.value}
                    text={GetColorName(groupedColorStock?.value?.value)}
                    className='extras-color-badge'
                  />
                }
              >
                <ProductGalleryMediaUpload
                  fileList={groupedColorStock?.images}
                  onAdd={(image) =>
                    handleChange({
                      type: 'add',
                      image,
                      extraValueId: groupedColorStock?.value?.id,
                    })
                  }
                  onRemove={(image) =>
                    handleChange({
                      type: 'remove',
                      image,
                      extraValueId: groupedColorStock?.value?.id,
                    })
                  }
                />
              </CustomCard>
            </Col>
          ))}
        </Row>
      </Spin>
      <Divider />
      <Space className='w-100 justify-content-end'>
        {onPrevPage && <Button onClick={onPrevPage}>{t('prev')}</Button>}
        <Button
          type='primary'
          htmlType='submit'
          loading={isSubmitting}
          onClick={onFinish}
        >
          {t('next')}
        </Button>
      </Space>
    </>
  );
};
