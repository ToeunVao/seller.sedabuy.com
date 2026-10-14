import { Fragment, useContext, useState, useEffect } from 'react';
import { Button, Space, Switch, Table, Image, Card, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import DeleteButton from 'components/delete-button';
import SearchInput from 'components/search-input';
import { Context } from 'context/context';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchLooks } from 'redux/slices/looks';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import looksService from 'services/banner';
import { useNavigate } from 'react-router-dom';
import ColumnImage from 'components/column-image';
import { getDateFormat } from 'helpers/get-date-format';

export default function Looks() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsModalVisible } = useContext(Context);

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { looks, loading, meta } = useSelector(
    (state) => state.looks,
    shallowEqual,
  );

  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [active, setActive] = useState(false);
  const [filters, setFilters] = useState({ page: 1, search: '' });

  const params = {
    search: filters.search || undefined,
    page: filters.page,
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('title'),
      dataIndex: 'translation',
      key: 'title',
      is_show: true,
      render: (translation) => translation?.title || t('N/A'),
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (img) => <ColumnImage image={img} />,
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (created_at) => getDateFormat({ date: created_at }),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active, record) => (
        <Switch
          onChange={() => {
            setId([record?.id]);
            setActive(true);
            setIsModalVisible(true);
          }}
          checked={Boolean(active)}
        />
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
            onClick={() => goToEdit(record?.id)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([record?.id]);
              setActive(false);
            }}
          />
        </Space>
      ),
    },
  ];

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleActive = () => {
    setLoadingBtn(true);
    looksService
      .setActive(id)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setIsModalVisible(false);
        setActive(false);
        setId(null);
      });
  };

  const handleDeleteLook = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    looksService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setIsModalVisible(false);
        setActive(false);
        setId(null);
      });
  };

  const deleteSelected = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.look'));
    } else {
      setIsModalVisible(true);
    }
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const goToAdd = () => {
    dispatch(
      addMenu({
        id: 'look_add',
        url: 'catalog/looks/add',
        name: 'add.look',
      }),
    );
    navigate('add');
  };

  const goToEdit = (id) => {
    dispatch(
      addMenu({
        id: 'look_edit',
        url: `catalog/looks/${id}`,
        name: 'edit.look',
      }),
    );
    navigate(`${id}`);
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const fetch = () => {
    dispatch(fetchLooks(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Fragment>
      <Card>
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            style={{ width: 200 }}
            defaultValue={filters.search}
            resetSearch={!filters.search}
            handleChange={(search) => handleFiltersChange({ search, page: 1 })}
          />
          <DeleteButton icon={<DeleteOutlined />} onClick={deleteSelected}>
            {t('delete.selected')}
          </DeleteButton>
          <Button type='primary' onClick={goToAdd}>
            {t('add.looks')}
          </Button>
        </Space>
        <Divider />
        <Table
          scroll={{ x: true }}
          rowKey={(record) => record.id}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={looks}
          loading={loading}
          pagination={{
            showSizeChanger: false,
            pageSize: meta?.per_page || 10,
            current: meta?.current_page || 1,
            total: meta?.total || 0,
          }}
          onChange={onChangePagination}
        />
      </Card>
      <CustomModal
        click={active ? handleActive : handleDeleteLook}
        text={active ? t('set.active') : t('delete.selected')}
        loading={loadingBtn}
        setActive={setActive}
      />
    </Fragment>
  );
}
