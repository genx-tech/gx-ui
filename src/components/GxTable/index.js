import React, { useState } from "react";
import {
    Table,
    Input,
    InputNumber,
    Popconfirm,
    Form,
    Divider,
    Spin
} from "antd";
import { insertBetween } from "utils/lang";

const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    editorStyle,
    editorRules,
    ...restProps
}) => {
    const inputNode = inputType === "number" ? <InputNumber /> : <Input />;
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    style={editorStyle}
                    rules={editorRules && editorRules(record)}
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

export const makeAction = (record, rowIndex, label, handler, otherProps) => (
    <a href="#!" onClick={() => handler(record, rowIndex)} {...otherProps}>
        {label}
    </a>
);

export const NonExistKey = "";

/**
 *
 * @param {object} props
 * @see {@link https://ant.design/components/table-cn/} for more Table properties
 */

const GxTable = ({
    keyField,
    columns,
    data,
    editable,
    onSaveRecord,
    onError,    
    pagination,
    actionSeparator,
    saveLabel,
    cancelLabel,
    cancelConfirmText,
    ...tableProps
}) => {
    //internal state and stateUpdater
    const [form] = editable ? Form.useForm() : [];
    const [dataCache, setDataCache] = useState(data);
    const [editingKey, setEditingKey] = useState(NonExistKey);
    const [pending, setPending] = useState(false);

    //key related
    keyField || (keyField = "key");

    const getKey = record => record[keyField];
    const isRowEditing = record => getKey(record) === editingKey;
    
    //default action handler
    const edit = (record) => {
        form.setFieldsValue({ ...record });
        setEditingKey(getKey(record));
    };

    const cancel = () => {
        setEditingKey(NonExistKey);
    };

    const save = async (orginalRecord, rowIndex) => {
        const key = getKey(orginalRecord);

        setPending(true);
        try {
            const row = await form.validateFields();
            await onSaveRecord(key, row, rowIndex);

            const newData = [...dataCache];
            const item = newData[rowIndex];
            newData.splice(rowIndex, 1, { ...item, ...row });
            setDataCache(newData);
            setEditingKey(NonExistKey);
        } catch (errInfo) {
            if (onError) {
                onError(errInfo, "save");
            } else {
            }
        } finally {
            setPending(false);
        }
    };

    actionSeparator || (actionSeparator = <Divider type="vertical" />); 

    const mergedColumns = columns.map(col => {
        if (col.actions) {
            return {
                ...col,
                render: (text, record, rowIndex) => {
                    const rowEditing = isRowEditing(record);
                    const tableEditing = editingKey !== NonExistKey;

                    return rowEditing ? (
                        col.customEditingActions ? (
                            insertBetween(col.customEditingActions.map((action, i) => {
                                if (action.show && !action.show(record)) {
                                    return false;
                                }

                                if (action.render) {
                                    return action.render(
                                        record,
                                        tableEditing,
                                        i
                                    );
                                }

                                return false;
                            }), actionSeparator)
                        ) : (
                            <span>
                                {makeAction(record, rowIndex, saveLabel || "Save", save)}                                
                                {actionSeparator}
                                <Popconfirm
                                    title={cancelConfirmText || "Are you sure to cancel?"}
                                    onConfirm={cancel}
                                >
                                    <a>{cancelLabel || "Cancel"}</a>
                                </Popconfirm>
                            </span>
                        )
                    ) : (
                        <span>
                            {insertBetween(
                                col.actions.map((action, i) => {
                                    if (action.show && !action.show(record)) {
                                        return false;
                                    }

                                    if (action.render) {
                                        return action.render(
                                            record,
                                            tableEditing,
                                            i
                                        );
                                    }

                                    if (action.type === "edit") {
                                        return makeAction(record, rowIndex, action.label, edit, { key: i, disabled: tableEditing });
                                    }

                                    return false;
                                }),
                                actionSeparator
                            )}
                        </span>
                    );
                }
            };
        }

        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: (record, rowIndex) => ({
                record,
                inputType: col.inputType || "text",
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isRowEditing(record)
            })
        };
    });

    const TableCore = (
        <Table
            components={{
                body: {
                    cell: EditableCell
                }
            }}
            dataSource={dataCache}
            columns={mergedColumns}
            pagination={{
                onChange: cancel,
                hideOnSinglePage: true,
                ...pagination
            }}
            {...tableProps}
        />
    );

    return (
        <Spin spinning={pending}>
            {editable ? (
                <Form form={form} component={false}>
                    {TableCore}
                </Form>
            ) : (
                TableCore
            )}
        </Spin>
    );
};

export default GxTable;
