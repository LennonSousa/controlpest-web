import { useState, useEffect } from 'react';
import { Pagination } from 'react-bootstrap';

interface WaitingModalProps {
    pages: number,
    active?: number;
    handleActivePage: (page: number) => Promise<void>;
}

const Paginations: React.FC<WaitingModalProps> = ({ pages, active = 1, handleActivePage }) => {
    const [pageItems, setPageItems] = useState<JSX.Element[]>([]);

    useEffect(() => {
        let items: JSX.Element[] = [];

        for (let index = 1; index <= pages; index++) {
            items.push(
                <Pagination.Item
                    key={index}
                    active={index === active}
                    onClick={() => handleActivePage(index)}
                >
                    {index}
                </Pagination.Item>,
            );
        }

        setPageItems(items);
    }, [pages, active]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Pagination size="sm">{pageItems}</Pagination>
    )
}

export { Paginations };