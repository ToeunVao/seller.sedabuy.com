import { useContext, useEffect, useState } from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button, Table, Space, Card, Switch, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Context } from 'context/context';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import unitService from 'services/unit';
import { fetchUnits } from 'redux/slices/unit';
import { useTranslation } from 'react-i18next';
import FilterColumns from 'components/filter-column';
import DeleteButton from 'components/delete-button';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';

export default function Units() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { units, meta, loading } = useSelector(
    (state) => state.unit,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [uuid, setUUID] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [active, setActive] = useState(null);
  const [filters, setFilters] = useState({ page: 1, search: '' });
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
      key: 'title',
      is_show: true,
      render: (translation) => translation?.title || t('N/A'),
    },
    {
      title: t('position'),
      dataIndex: 'position',
      key: 'position',
      is_show: true,
      render: (position) => t(position),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active, row) => (
        <Switch
          onChange={() => {
            setIsModalVisible(true);
            setUUID([row?.id]);
            setActive(true);
          }}
          checked={active}
        />
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <DeleteButton
            onClick={() => {
              setUUID([row?.id]);
              setIsModalVisible(true);
              setText(true);
              setActive(false);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    page: filters.page,
    search: filters.search || undefined,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        id: 'unit-edit',
        url: `unit/${row.id}`,
        name: t('edit.unit'),
      }),
    );
    navigate(`/unit/${row.id}`);
  };

  const unitDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...uuid.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    unitService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setIsModalVisible(false);
        setText(null);
        setActive(false);
      });
  };

  const handleActive = () => {
    setLoadingBtn(true);
    const data = uuid.find((item) => item);
    unitService
      .setActive(data)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setIsModalVisible(false);
        setUUID([]);
        setActive(false);
      });
  };

  const onChange = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const goToAddUnit = () => {
    dispatch(
      addMenu({
        id: 'unit-add',
        url: 'unit/add',
        name: t('add.unit'),
      }),
    );
    navigate('/unit/add');
  };

  const rowSelection = {
    selectedRowKeys: uuid,
    onChange: (key) => {
      setUUID(key);
    },
  };

  const allDelete = () => {
    if (uuid === null || uuid.length === 0) {
      toast.warning(t('select.unit'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchUnits(params));
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
          handleChange={(search) => handleFiltersChange({ search, page: 1 })}
          defaultValue={filters.search}
          resetSearch={!filters.search}
          style={{ width: 200 }}
        />
        <FilterColumns columns={columns} setColumns={setColumns} />
        <DeleteButton onClick={allDelete}>{t('delete.selected')}</DeleteButton>
        <Button type='primary' onClick={goToAddUnit}>
          {t('add.unit')}
        </Button>
      </Space>
      <Divider />
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        loading={loading}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={units}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          current: meta?.current_page || 1,
          total: meta?.total || 0,
        }}
        onChange={onChange}
        rowKey={(record) => record?.id}
      />
      <CustomModal
        click={active ? handleActive : unitDelete}
        text={
          active
            ? t('set.active.food')
            : text
              ? t('delete')
              : t('delete.selected')
        }
        loading={loadingBtn}
        setText={setUUID}
        setActive={setActive}
      />
    </Card>
  );
}
