import React from 'react';
import PropTypes from 'prop-types';

import { Table, Input, InputNumber, Dropdown, Checkbox, Menu, Popconfirm, Form, Button, Divider } from 'antd';
import FilterList from './FilterList';


const EditableContext = React.createContext();
const { Search } = Input;

function EditableCell(props) {
    const getInput = () => {
        if (props.inputType === 'number') {
            return <InputNumber />;
        }
        return <Input />;
    };

    const renderCell = () => {
        const {
            editing,
            dataIndex,
            title,
            inputType,
            record,
            index,
            children,
            ...restProps
        } = props;

        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item style={{ margin: 0 }}
                        rules={[
                                {
                                    required: true,
                                    message: `Please Input ${title}!`,
                            },
                        ]}
                        initialValue={record[dataIndex]}
                    >
                        {getInput()}
                    </Form.Item>
                ) : (
                        children
                    )}
            </td>
        );
    };

    return <EditableContext.Consumer>{renderCell}</EditableContext.Consumer>;
}

function ColumnDropdown(props) {
    const { visibleColumns, onChange } = props;
    const columns = props.columns.filter(col => col.title.toLowerCase() !== "key");

    const isColumnVisible = col => visibleColumns.includes(col);

    const checkboxes = (
        <Menu multiple={true}>
            {columns.map(col => (
                <Menu.Item key={col.title}>
                    <Checkbox
                        onChange={() => onChange(col.title)}
                        checked={isColumnVisible(col.title)}
                    >
                        {col.title}
                    </Checkbox>
                </Menu.Item>
            ))}
        </Menu>
    );

    return (
        <Dropdown overlay={checkboxes} trigger={["click"]}>
            <Button icon="table" />
        </Dropdown>
    )
}

class EditableTable extends React.Component {

    constructor(props) {
        super(props);
        const { columns, onSave, onDelete } = this.props;
        this.state = {
            visibleColumns: columns.map(col => col.title).filter(title => title !== "Key"),
            selectedRowKeys: [],
            editingKey: '',
        }

        this.actions = {
            title: 'operation',
            dataIndex: 'operation',
            render: (text, record) => {
                const { editingKey } = this.state;
                const editable = this.isEditing(record);
                return editable ? (
                    <span>
                        <EditableContext.Consumer>
                            {form => (
                                <a onClick={() => this.save(form, record.key)}>
                                    Save
                                </a>
                            )}
                        </EditableContext.Consumer>
                        <Divider type="vertical" />
                        <Popconfirm title="Sure to cancel?" onConfirm={() => this.cancel(record.key)}>
                            <a>Cancel</a>
                        </Popconfirm>
                    </span>
                ) : (
                        <span>
                            {onSave &&
                                <>
                                    <a disabled={editingKey !== ''} onClick={() => this.edit(record.key)}>
                                        Edit
                                    </a>
                                    <Divider type="vertical" />
                                </>
                            }
                            {onDelete &&
                                <Popconfirm title="Sure to delete?" onConfirm={() => onDelete(record.key)}>
                                    <a>Delete</a>
                                </Popconfirm>
                            }
                        </span>
                    );
            },
        };
    }

    static propTypes = {
        dataSource: PropTypes.array.isRequired,
        columns: PropTypes.arrayOf(PropTypes.shape({
            title: PropTypes.string.isRequired,
            dataIndex: PropTypes.string.isRequired,
            key: PropTypes.string.isRequired,
            editable: PropTypes.bool,
            sortable: PropTypes.bool,
            sorter: PropTypes.func,
        })).isRequired,
        onSearch: PropTypes.func,
        onSave: PropTypes.func,
        onDelete: PropTypes.func,
        filterListsTitle: PropTypes.string,
        filterLists: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string,
            filters: PropTypes.arrayOf(PropTypes.shape({
                name: PropTypes.string,
                value: PropTypes.any
            })).isRequired,
            name: PropTypes.string.isRequired
        })),
        onFilter: PropTypes.func,
        showPagination: PropTypes.bool,
        showColumns: PropTypes.bool,
        pagination: PropTypes.shape({
            position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
            onChange: PropTypes.func,
            pageSizeOptions: PropTypes.array,
            showSizeChanger: PropTypes.bool,
            showQuickJumper: PropTypes.bool,
        })
    }

    static defaultProps = {
        showColumns: false,
        showPagination: true,
        rowSelectable: false,
        pagination: {
            position: 'bottom',
            pageSizeOptions: ['10', '20', '30', '40'],
            showSizeChanger: true,
            showQuickJumper: true,
        },
        filterListsTitle: "List filters:",
    }

    handleChangeVisibleColumns = title => {
        const columns = [...this.state.visibleColumns];
        const index = columns.findIndex(col => col === title);
        if (index > -1) {
            columns.splice(index, 1);
        } else {
            columns.push(title);
        }
        this.setState({ visibleColumns: columns });
    }

    onSelectChange = selectedRowKeys => {
        this.setState({ selectedRowKeys });
    };

    sorter = (a, b, name) => {
        if (typeof a[name] === 'string') {
            return a[name].localeCompare(b[name]);
        }
        return a[name] - b[name];
    }

    // edit action
    isEditing = record => record.key === this.state.editingKey;

    edit(key) {
        this.setState({ editingKey: key });
    }

    cancel = () => {
        this.setState({ editingKey: '' });
    };

    save(form, key) {
        form.validateFields((error, row) => {
            if (error) {
                return;
            }
            this.setState({ editingKey: '' });
            this.props.onSave(key, row);
        });
    }

    render() {
        const components = {
            body: {
                cell: EditableCell,
            },
        };

        const { filterLists, filterListsTitle, onFilter, filterList, onSearch, showColumns, onSave, onDelete, rowSelectable, pagination, showPagination, columns, ...others } = this.props;
        const { visibleColumns, selectedRowKeys } = this.state;

        const displayColumns = columns
            .filter(col => visibleColumns.includes(col.title))
            .map(col => {
                if (!col.sortable || col.sorter) {
                    return col;
                }
                return {
                    ...col,
                    sorter: (a, b) => this.sorter(a, b, col.dataIndex)
                }
            })
            .map(col => {
                if (!col.editable) {
                    return col;
                }
                return {
                    ...col,
                    onCell: record => ({
                        record,
                        inputType: col.inputType,
                        dataIndex: col.dataIndex,
                        title: col.title,
                        editing: this.isEditing(record),
                    }),
                };
            });

        const showActions = onSave || onDelete;

        const rowSelection = rowSelectable ? {
            selectedRowKeys,
            onChange: this.onSelectChange,
        } : undefined;

        const hasSelected = selectedRowKeys.length > 0;

        return (
            <>
                <Form
                    layout="inline"
                    className="components-table-demo-control-bar"
                    style={{ margin: 16, display: 'flex', justifyContent: 'flex-end' }}
                >
                    {onSearch &&
                        <Form.Item>
                            <Search
                                placeholder="Search"
                                onSearch={onSearch}
                                style={{ width: 200 }}
                                allowClear={true}
                            />
                        </Form.Item>
                    }
                    {showColumns &&
                        <Form.Item>
                            <ColumnDropdown
                                columns={columns}
                                visibleColumns={visibleColumns}
                                onChange={this.handleChangeVisibleColumns}
                            />
                        </Form.Item>
                    }
                    {filterList}
                    {filterLists && filterLists.length > 0 &&
                        <Form.Item label={filterListsTitle}>
                            <FilterList filterLists={filterLists} onFilter={onFilter} />
                        </Form.Item>
                    }
                </Form>
                <EditableContext.Provider value={this.props.form}>
                    <Table
                        {...others}
                        components={components}
                        columns={showActions ? [...displayColumns, this.actions] : displayColumns}
                        rowSelection={rowSelection}
                        pagination={showPagination ? { ...pagination } : false}
                    />
                </EditableContext.Provider>
            </>
        )
    }

}

export default EditableTable;