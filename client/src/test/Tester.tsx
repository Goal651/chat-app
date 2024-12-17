
import SocketConfig from '../config/SocketConfig';


const Tester = ({ serverUrl }: { serverUrl: string }) => {
    return (
        <div>
            <div className='text-3xl'>Testing socket</div>
            <SocketConfig />
        </div>
    )

};

export default Tester
