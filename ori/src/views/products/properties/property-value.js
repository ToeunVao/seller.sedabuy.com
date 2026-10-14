import { useState, useEffect } from 'react';
import { Button, Space, Table, Card, Divider } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchPropertyValues } from 'redux/slices/propertyValue';
import propertyService from 'services/property';
import PropertyValueModal from './property-value-modal';
import PropertyDeleteModal from './property-delete-modal';
import DeleteButton from 'components/delete-button';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import FilterColumns from 'components/filter-column';
import { InfiniteSelect } from 'components/infinite-select';
import useDidUpdate from 'helpers/useDidUpdate';
import ColumnImage from 'components/column-image';

export default function PropertyValue() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { propertyValues, loading, meta } = useSelector(
    (state) => state.propertyValue,
    shallowEqual,
  );

  const [id, setId] = useState(null);
  const [modal, setModal] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    group: null,
  });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('title'),
      dataIndex: 'group',
      key: 'group',
      is_show: true,
      render: (group) => group?.translation?.title || t('N/A'),
    },
    {
      title: t('value'),
      dataIndex: 'value',
      key: 'value',
      is_show: true,
      render: (value, row) => (
        <Space className='extras'>
          {row?.group?.type === 'color' && (
            <div
              className='extra-color-wrapper-contain'
              style={{ backgroundColor: value }}
            />
          )}
          {row?.group?.type === 'image' && <ColumnImage image={value} />}
          {row.group.type !== 'image' && value}
        </Space>
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (record) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => setModal(record)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => setId([record?.id])}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    group_id: filters.group?.value,
    perPage: 10,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleCancel = () => setModal(null);

  const deleteProperty = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    propertyService
      .deleteValue(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
      });
  };

  const fetchPropertyGroups = ({ search, page }) => {
    const params = {
      search: search || undefined,
      page,
    };
    return propertyService.getAllGroups(params).then((res) => {
      return res?.data?.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const fetch = () => {
    dispatch(fetchPropertyValues(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, []);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  return (
    <Card>
      <Space wrap>
        <InfiniteSelect
          placeholder={t('select.group')}
          style={{ minWidth: 180 }}
          value={filters.group}
          fetchOptions={fetchPropertyGroups}
          onChange={(group) => handleFiltersChange({ group, page: 1 })}
        />
        <FilterColumns columns={columns} setColumns={setColumns} />
        <Button type='primary' onClick={() => setModal({})}>
          {t('add.property')}
        </Button>
      </Space>
      <Divider />
      <Table
        scroll={{ x: true }}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={propertyValues}
        rowKey={(record) => record.id}
        pagination={{
          showSizeChanger: false,
          current: meta?.current_page || 1,
          pageSize: meta?.per_page || 10,
          total: meta?.total || 0,
        }}
      />
      {Boolean(modal) && (
        <PropertyValueModal modal={modal} handleCancel={handleCancel} />
      )}
      {Boolean(id) && (
        <PropertyDeleteModal
          id={id}
          click={deleteProperty}
          text={t('delete.property')}
          loading={loadingBtn}
          handleClose={() => setId(null)}
        />
      )}
    </Card>
  );
}
