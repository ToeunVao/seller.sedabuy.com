import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button, Col, Divider, Form, Row, Space } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { InfiniteSelect } from 'components/infinite-select';
import { useState } from 'react';
import categoryService from 'services/category';
import settingService from 'services/settings';
import { toast } from 'react-toastify';
import { fetchSettings as getSettings } from 'redux/slices/globalSettings';
import { CustomCard } from 'components/custom-card';

const HomePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [hasMore, setHasMore] = useState({
    categories: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangeHasMore = (key, value) => {
    setHasMore((prev) => ({ ...prev, [key]: value }));
  };

  const fetchCategories = ({ search, page }) => {
    const params = {
      search: search || undefined,
      page,
      perPage: 10,
      status: 'published',
      type: 'main',
    };
    return categoryService.getAll(params).then((res) => {
      handleChangeHasMore('categories', Boolean(res?.data?.links?.next));
      return res?.data?.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: JSON.stringify({ translations: item?.translations }),
      }));
    });
  };

  const onFinish = (values) => {
    setIsSubmitting(true);
    const body = {
      home_page_categories: JSON.stringify(
        values?.categories?.map((item) => ({
          id: item?.value,
          translations: JSON.parse(item?.key || '{}')?.translations,
        })) || [],
      ),
    };
    settingService
      .update(body)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(getSettings());
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const initialValues = {
    categories:
      JSON.parse(
        typeof activeMenu.data?.home_page_categories === 'string'
          ? activeMenu.data?.home_page_categories || '[]'
          : '[]',
      )?.map((item) => ({
        label:
          item?.translations?.find((i) => i?.locale === 'en')?.title ||
          t('N/A'),
        value: item?.id,
        key: JSON.stringify({ translations: item?.translations }),
      })) || [],
  };

  return (
    <CustomCard title={t('home.page.items')}>
      <Form
        form={form}
        layout='vertical'
        initialValues={initialValues}
        onFinish={onFinish}
      >
        <Row gutter={12}>
          <Col flex={1}>
            <Form.Item
              label={t('categories')}
              name='categories'
              rules={[{ required: true, message: t('required') }]}
            >
              <InfiniteSelect
                labelInValue
                hasMore={hasMore.categories}
                mode='multiple'
                fetchOptions={fetchCategories}
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Space className='w-100 justify-content-end'>
          <Button type='primary' htmlType='submit' loading={isSubmitting}>
            {t('save')}
          </Button>
        </Space>
      </Form>
    </CustomCard>
  );
};

export default HomePage;
