import DataTable from 'react-data-table-component';

export default function ScrollableDataTable({ scrollHeight = 'calc(100vh - 240px)', ...props }) {
    return (
        <div className="app-data-table">
            <DataTable
                {...props}
                responsive
                fixedHeader
                fixedHeaderScrollHeight={scrollHeight}
            />
        </div>
    );
}
