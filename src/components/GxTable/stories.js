import React from 'react';

import 'antd/dist/antd.css';

import GxTable from 'components/GxTable';

import { dataGridData, dataGridColumns } from 'stories/mocking.data';

export default {
  title: 'Component - GxTable',
};

export const basic = () => <GxTable columns={dataGridColumns} data={dataGridData} onSaveRecord={(key, row) => console.log(row)} />;

export const editable = () => <GxTable editable columns={dataGridColumns} data={dataGridData} onSaveRecord={(key, row) => console.log(row)} />;

