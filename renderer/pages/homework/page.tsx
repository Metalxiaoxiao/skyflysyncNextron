'use client'
import React, {useEffect, useState} from 'react';
import { Card, Row, Col, Empty } from 'antd';
import Layout from './layout';



const HomeworkPage = () => {
    const [homeworkData,setHomeworkData] = useState([]);
    useEffect(() => {
        window.ipc.invoke('getHomeworkData').then((data)=>{
            setHomeworkData(data);
        })
        window.ipc.on('uploadHomework',(evt,homework)=>{
            setHomeworkData([...homeworkData,homework]);
        })
    }, []);
    return (
        <Layout>
           <div style={{ padding: '20px' }}>
            <Row gutter={16}>
                {homeworkData.length>0 ? homeworkData.map((homework, index) => (
                    <Col span={8} key={index}>
                        <Card title={`${homework.subject}`} style={{ marginBottom: '16px' }}>
                            <p style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{homework.content}</p>
                            <div style={{ marginTop: 'auto' }}>{"布置者:"+homework.sender+"老师"}</div>
                        </Card>
                    </Col>
                )):<Empty></Empty>}

            </Row>
        </div> 
        </Layout>
        
    );
};

export default HomeworkPage;
