import { useState, useEffect } from 'react';
import moment from 'moment';
import workingDays from 'services/workingDays';
import closeDates from 'services/closedDays';
import { useParams } from 'react-router-dom';
import { weeks } from 'components/shop/weeks';
import ShopDeliveryForm from 'components/forms/shop-delivery-form';
import { Form, Spin } from 'antd';

const ShopDelivery = ({ next, prev }) => {
  const [form] = Form.useForm();
  const { uuid } = useParams();
  const [days, setDays] = useState([]);
  const [lines, setLines] = useState(new Array(7).fill(false));
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDays = () => {
    setLoading(true);
    Promise.all([closeDates.getById(uuid), workingDays.getById(uuid)])
      .then((closeDatesResponse, workingDaysResponse) => {
        setDays(
          closeDatesResponse?.data?.closed_dates
            .filter(
              (date) => date.day > moment(new Date()).format('YYYY-MM-DD'),
            )
            .map((itm) => new Date(itm.day)),
        );
        if (
          workingDaysResponse?.data?.dates &&
          workingDaysResponse?.data?.dates?.length !== 0
        ) {
          form.setFieldsValue({
            working_days: workingDaysResponse?.data?.dates?.map((item) => ({
              title: item?.day,
              from: moment(item?.from, 'HH:mm:ss'),
              to: moment(item?.to, 'HH:mm:ss'),
              disabled: Boolean(item?.disabled),
            })),
          });
          setLines(
            workingDaysResponse?.data?.dates?.map((item) => item.disabled),
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const closeDatesBody = {
      dates: days
        ? days.map((item) => moment(item).format('YYYY-MM-DD'))
        : undefined,
    };

    const workingDaysBody = {
      dates: values.working_days.map((item) => ({
        day: item.title,
        from: moment(item.from ? item.from : '00').format('HH:mm'),
        to: moment(item.to ? item.to : '00').format('HH:mm'),
        disabled: item.disabled,
      })),
    };

    const requests = [
      closeDates.update(uuid, closeDatesBody),
      values.working_days.length !== 0 &&
        workingDays.update(uuid, workingDaysBody),
    ].filter(Boolean);

    Promise.all(requests)
      .then(() => {
        next();
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  useEffect(() => {
    form.setFieldsValue({
      working_days: weeks,
    });
    if (uuid) fetchDays();
  }, []);

  return (
    <Spin spinning={loading}>
      <ShopDeliveryForm
        onFinish={onFinish}
        prev={prev}
        form={form}
        lines={lines}
        loadingBtn={loadingBtn}
        days={days}
        setDays={setDays}
        setLines={setLines}
        weeks={weeks}
      />
    </Spin>
  );
};

export default ShopDelivery;
