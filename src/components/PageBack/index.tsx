import Link from 'next/link';
import { FaLongArrowAltLeft } from 'react-icons/fa';

interface DocsCustomerProps {
    title?: string;
    subTitle?: string;
    href: string;
}

const PageBack: React.FC<DocsCustomerProps> = ({ title = "voltar", subTitle = "Voltar", href }) => {

    return (
        <Link href={href}>
            <a title={subTitle} className="d-print-none" data-title={subTitle}>
                <FaLongArrowAltLeft /> {title}</a>
        </Link>
    )
}

export default PageBack;