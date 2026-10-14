import { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Space, Table } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setMenuData } from 'redux/slices/menu';
import productService from 'services/product';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import DeleteButton from 'components/delete-button';
import propertyService from 'services/property';
import { DebounceSelect } from 'components/search';
import { toast } from 'react-toastify';

const ProductProperty = ({ next, prev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { uuid } = useParams();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [dataSource, setDataSource] = useState([]);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [isFetching, setFetching] = useState(false);
  const [groupSelected, setGroupSelected] = useState(null);

  const column = [
    {
      key: '2',
      title: t('property.group'),
      dataIndex: 'group',
      render: (group) => group?.translation?.title || t('N/A'),
    },
    {
      key: '4',
      title: t('property.value'),
      dataIndex: 'value',
      render: (value) => value?.value || t('N/A'),
    },
    {
      key: '5',
      title: t('options'),
      render: (record) => (
        <Space>
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => onDeleteProduct(record)}
          />
        </Space>
      ),
    },
  ];

  const addProperties = (data) => {
    productService
      .properties(uuid, { properties: data })
      .then(() => {
        toast.success(t('product.properties.saved'));
        fetchProduct(uuid);
      })
      .finally(() => setLoadingBtn(false));
  };

  const onDeleteProduct = (record) => {
    Modal.confirm({
      title: t('delete.product'),
      okText: t('yes'),
      okType: 'danger',
      onOk: () => {
        const data = dataSource
          ?.filter((item) => item.id !== record.id)
          ?.map((item) => item?.value?.id);
        addProperties(data);
      },
    });
  };

  const fetchProduct = (id) => {
    setFetching(true);
    productService
      .getById(id)
      .then(({ data }) => {
        setDataSource(data?.properties?.filter((item) => item?.value));
        form.resetFields();
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const valuesProperties = values.propertyValue.map((item) => item.value);
    const oldIds = dataSource?.map((item) => item?.value?.id);
    const set = new Set([...valuesProperties, ...oldIds]);
    const setArray = Array.from(set);
    addProperties({ ...setArray });
  };

  const fetchPropertyGroup = (search) => {
    const params = {
      search: search || undefined,
      perPage: 10,
      page: 1,
    };

    return propertyService.getAllGroups(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const fetchPropertyValue = (search) => {
    const params = {
      search: search || undefined,
      perPage: 10,
      page: 1,
      group_id: groupSelected?.value,
    };

    return propertyService.getAllValues(params).then((res) =>
      res.data.map((item) => ({
        label: item?.value || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  useEffect(() => {
    if (dataSource.length && uuid) {
      const properties = dataSource;
      dispatch(
        setMenuData({
          activeMenu,
          data: { ...activeMenu.data, properties },
        }),
      );
    }
  }, [dataSource]);

  useEffect(() => {
    if (uuid) {
      fetchProduct(uuid);
    }
  }, []);

  return (
    <>
      <Form
        name='property-form'
        layout='vertical'
        form={form}
        onFinish={onFinish}
      >
        <Row
          gutter={12}
          className='mb-3'
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Col span={10}>
            <Form.Item
              name={'propertyGroup'}
              label={t('property.group')}
              rules={[{ required: true, message: t('required') }]}
            >
              <DebounceSelect
                fetchOptions={fetchPropertyGroup}
                placeholder={t('select.group')}
                onSelect={(item) => {
                  setGroupSelected(item);
                  form.setFieldsValue({ propertyValue: [] });
                }}
                onClear={() => {
                  setGroupSelected(null);
                  form.setFieldsValue({ propertyValue: [] });
                }}
              />
            </Form.Item>
          </Col>
          <Col flex={1}>
            <Form.Item
              name={'propertyValue'}
              label={t('property.value')}
              rules={[{ required: true, message: t('required') }]}
            >
              <DebounceSelect
                fetchOptions={fetchPropertyValue}
                placeholder={t('select.value')}
                refetchOptions
                disabled={!groupSelected}
                mode='multiple'
              />
            </Form.Item>
          </Col>
          <Col>
            <Button type='primary' htmlType='submit' loading={loadingBtn}>
              {t('save')}
            </Button>
          </Col>
        </Row>
      </Form>
      <Table
        scroll={{ x: true }}
        columns={column}
        dataSource={dataSource}
        pagination={false}
        rowKey={(record) => record.id}
        loading={isFetching}
      />
      <Space className='mt-4 w-100 justify-content-end'>
        <Button onClick={prev}>{t('prev')}</Button>
        <Button type='primary' onClick={next}>
          {t('next')}
        </Button>
      </Space>
    </>
  );
};

export default ProductProperty;
