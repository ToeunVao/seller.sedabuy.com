import { Fragment, useEffect, useState } from 'react';
import {
  Form,
  Row,
  Col,
  Select,
  Input,
  Button,
  Space,
  Divider,
  Spin,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import shopSocialService from 'services/shop-social';
import useDidUpdate from 'helpers/useDidUpdate';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch } from 'redux/slices/menu';

const defaultSocialMediaOptions = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Youtube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Snapchat', value: 'snapchat' },
  { label: 'WeChat', value: 'wechat' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Twitch', value: 'twitch' },
  { label: 'Discord', value: 'discord' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Steam', value: 'steam' },
  { label: 'Spotify', value: 'spotify' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Skype', value: 'skype' },
  { label: 'Twitter', value: 'twitter' },
];

const generateShortUUID = (length = 8) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

export default function ShopSocial({ prev, next }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const shopId = activeMenu.data?.id;

  const [socialList, setSocialList] = useState([
    { type: '', content: '', id: generateShortUUID() },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const addSocialMedia = () => {
    setSocialList([
      ...socialList,
      { type: '', content: '', id: generateShortUUID() },
    ]);
  };

  const removeSocialMedia = (remove) => {
    setSocialList(socialList.filter((item) => item.id !== remove.id));
  };

  const handleChange = (type, changeId, value) => {
    setSocialList(
      socialList.flatMap((item) =>
        item.id === changeId ? { ...item, [type]: value } : item,
      ),
    );
  };

  const fetchShopSocial = () => {
    setLoading(true);
    shopSocialService
      .getAll({ shop_id: shopId })
      .then((res) => {
        if (res.data?.length) {
          setSocialList(
            res?.data?.map((item) => ({
              type: item?.type,
              content: item?.content,
              id: generateShortUUID(),
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  };

  const onFinish = () => {
    setLoadingBtn(true);
    const body = {
      shop_id: shopId,
      data: socialList
        .map((item) => {
          if (!item.type || !item.content) return null;
          return {
            type: item.type,
            content: item.content,
          };
        })
        .filter((item) => !!item),
    };

    return shopSocialService
      .create(body)
      .then(() => next())
      .finally(() => setLoadingBtn(false));
  };

  const fetch = () => {
    fetchShopSocial();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (shopId) {
      fetch();
    }
  }, [shopId]);

  useDidUpdate(() => {
    if (activeMenu.refetch && shopId) {
      fetch();
    }
  }, [activeMenu.refetch, shopId]);

  return (
    <Fragment>
      <Spin spinning={loading}>
        <Form onFinish={onFinish} layout='vertical'>
          {socialList.map((socialItem, index) => (
            <Row gutter={12} key={index}>
              <Col span={9}>
                <Form.Item label={t('type')}>
                  <Select
                    showSearch={true}
                    options={defaultSocialMediaOptions}
                    value={socialItem.type}
                    onChange={(value) =>
                      handleChange('type', socialItem.id, value)
                    }
                  />
                </Form.Item>
              </Col>
              <Col flex={1}>
                <Form.Item label={t('url')}>
                  <Input
                    value={socialItem.content}
                    onChange={(value) =>
                      handleChange('content', socialItem.id, value.target.value)
                    }
                  />
                </Form.Item>
              </Col>
              {socialList.length > 1 && (
                <Col
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    type='primary'
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeSocialMedia(socialItem)}
                  />
                </Col>
              )}
            </Row>
          ))}
          <Button className='w-100 my-3' type='dashed' onClick={addSocialMedia}>
            {t('add.social')}
          </Button>
          <Divider />
          <Space className='w-100 justify-content-end'>
            <Button onClick={prev}>{t('prev')}</Button>
            <Button type='primary' htmlType='submit' loading={!!loadingBtn}>
              {t('next')}
            </Button>
          </Space>
        </Form>
      </Spin>
    </Fragment>
  );
}
