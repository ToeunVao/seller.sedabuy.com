import { useEffect, useState, useContext } from 'react';
import { Button, Card, Divider, Space, Table } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import extraService from 'services/extra';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchExtraGroups } from 'redux/slices/extraGroup';
import { disableRefetch, setMenuData, setRefetch } from 'redux/slices/menu';
import ExtraGroupModal from './extra-group-modal';
import DeleteButton from 'components/delete-button';
import ExtraGroupShowModal from './extra-group-show-modal';
import FilterColumns from 'components/filter-column';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';

export default function ExtraGroup() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { extraGroups, meta, loading } = useSelector(
    (state) => state.extraGroup,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [show, setShow] = useState(null);
  const [modal, setModal] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
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
      dataIndex: 'translation',
      key: 'translation',
      is_show: true,
      render: (translation) => translation?.title,
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      is_show: true,
      render: (type) => t(type),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setShow(record.id)} />
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => setModal(record)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([record.id]);
              setText(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    search: filters.search || undefined,
    page: filters.page,
    perPage: 10,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleCancel = () => {
    setShow(null);
    setModal(null);
  };

  const onDeleteExtra = () => {
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
      .deleteGroup(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setId(null);
        setIsModalVisible(false);
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
      toast.warning(t('select.extra.group'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const handleFilter = (item, name) => {
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...activeMenu.data, [name]: item },
      }),
    );
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const fetch = () => {
    dispatch(fetchExtraGroups(params));
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
        <SearchInput
          placeholder={t('search')}
          handleChange={(search) => handleFilter(search, 'search')}
          defaultValue={activeMenu.data?.search}
          resetSearch={!activeMenu.data?.search}
          style={{ width: 200 }}
        />
        <FilterColumns columns={columns} setColumns={setColumns} />
        <DeleteButton onClick={allDelete}>{t('delete.selected')}</DeleteButton>
        <Button type='primary' onClick={() => setModal({})}>
          {t('add.extra')}
        </Button>
      </Space>
      <Divider />
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={extraGroups}
        rowKey={(record) => record?.id}
        pagination={{
          pageSize: params.perPage,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        onChange={onChangePagination}
      />
      {Boolean(modal) && (
        <ExtraGroupModal modal={modal} handleCancel={handleCancel} />
      )}
      <CustomModal
        click={onDeleteExtra}
        text={text ? t('delete') : t('delete.selected')}
        loading={loadingBtn}
        setText={setId}
      />
      {Boolean(show) && (
        <ExtraGroupShowModal open={show} handleClose={handleCancel} />
      )}
    </Card>
  );
}
