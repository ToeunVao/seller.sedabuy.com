import { useState, useEffect, useContext } from 'react';
import { Button, Space, Table, Card, Divider } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchExtraValues } from 'redux/slices/extraValue';
import extraService from 'services/extra';
import ExtraValueModal from './extra-value-modal';
import DeleteButton from 'components/delete-button';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import { InfiniteSelect } from 'components/infinite-select';
import { Context } from 'context/context';
import CustomModal from 'components/modal';
import ColumnImage from 'components/column-image';
import { GetColorName } from 'hex-color-to-color-name';

export default function ExtraValue() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { extraValues, loading, meta } = useSelector(
    (state) => state.extraValue,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [modal, setModal] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
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
      key: 'title',
      is_show: true,
      render: (group) => group?.translation?.title,
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
          {row?.group?.type !== 'color' &&
            row?.group?.type !== 'image' &&
            value}
          {row?.group?.type === 'color' && GetColorName(value)}
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
            onClick={() => {
              setId([record.id]);
              setIsModalVisible(true);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    perPage: 10,
    page: filters.page,
    group_id: filters.group?.value,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleCancel = () => setModal(null);

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const deleteExtra = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    extraService
      .deleteValue(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setId(null);
      });
  };

  const fetchExtraGroups = ({ search, page }) => {
    const params = {
      search: search || undefined,
      page,
    };
    return extraService.getAllGroups(params).then((res) => {
      return res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item.id,
        key: item.id,
      }));
    });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.extra.value'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchExtraValues(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  return (
    <Card>
      <Space wrap>
        <InfiniteSelect
          placeholder={t('select.group')}
          fetchOptions={fetchExtraGroups}
          style={{ minWidth: 180 }}
          onChange={(group) => handleFiltersChange({ group, page: 1 })}
          value={filters.group}
        />
        <FilterColumns columns={columns} setColumns={setColumns} />
        <DeleteButton icon={<DeleteOutlined />} onClick={allDelete}>
          {t('delete.selected')}
        </DeleteButton>
        <Button type='primary' onClick={() => setModal({})}>
          {t('add.extra')}
        </Button>
      </Space>
      <Divider />
      <Table
        scroll={{ x: true }}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        rowSelection={rowSelection}
        dataSource={extraValues}
        rowKey={(record) => record.id}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          total: meta?.total || 0,
          current: meta?.current_page || 1,
        }}
        onChange={onChangePagination}
      />
      {Boolean(modal) && (
        <ExtraValueModal
          isVisible={modal}
          modal={modal}
          handleCancel={handleCancel}
          paramsData={params}
        />
      )}
      <CustomModal
        click={deleteExtra}
        text={text ? t('delete') : t('delete.selected')}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
}
