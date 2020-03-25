import React, { useState, useEffect } from 'react';

import { Radio } from 'antd';

function RadioGroup(props) {
    const { filters, onChange, defaultValue, ...other } = props;
    return (
        <Radio.Group onChange={event => onChange(event.target.value)} defaultValue={defaultValue || filters[0].value} {...other}>
            {filters.map(({ name, value }) =>
                <Radio.Button value={value} key={name}>
                    {name}
                </Radio.Button>
            )}
        </Radio.Group>
    );
}


const FilterList = (props) => {

    const { filterLists, onFilter, defaultValues } = props;

    const [filters, setFilters] = useState(defaultValues || {});

    const handleChange = name => value => {
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilter(newFilters);
    }

    return (filterLists.map(({ filters, name, defaultValue }) =>
        <RadioGroup
            key={name}
            filters={filters}
            onChange={handleChange(name)}
            defaultValue={defaultValue}
            style={{ marginLeft: 8, marginRight: 8 }}
        />
    ))
}

export default FilterList;