'use client'
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
const { Countdown } = Statistic;


const onFinish = () => {
  console.log('finished!');
};
// const onChange = (val) => {
//   if (typeof val === 'number' && 4.95 * 1000 < val && val < 5 * 1000) {
//     console.log('changed!');
//   }
// };
const App = () => {
  const [deadline,setDeadline] = useState();
  useEffect(()=>{
    window.ipc.invoke('getCutdownData').then((data) => {
      setDeadline(data)
  });
  },[])
  
  return(
  <Card>
    <Row gutter={16}>
    <Col span={12}>
      {/* <Countdown title="Countdown" value={deadline} onFinish={onFinish} /> */}
      <Countdown style={{}} title="Day Level" value={deadline} format="D 天 H 时 m 分" />
    </Col>
  </Row>
  </Card>
  
);}
export default App;