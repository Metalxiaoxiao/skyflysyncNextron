// pages/Schedule.js
'use client'
import React, {SetStateAction, useEffect, useState} from 'react';
import { Typography } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { Card, Steps} from 'antd';

const { Step } = Steps
const Schedule = () => {
    const [scheduleData,setSchedule] = useState([
    ]);
    const [currentClass,setCurrentClass] = useState(0);
    useEffect(() => {
        window.ipc.on('updateClasses',(msg:{classList})=>{
            setSchedule(msg.classList);
        })
        window.ipc.on('updateCurrentClass',(msg:SetStateAction<number>)=>{

            setCurrentClass(msg)
        })
        window.ipc.invoke('getClassesByDay').then((data)=>{
            setSchedule(data);
        })
    }, []);
    const today = new Date().toLocaleDateString();

    const todayEvents = scheduleData.map(event => ({ ...event, date: today }));

    return (

            // <Steps progressDot current={1}>
            //     <Step title="Finished" description="This is a description." />
            //     <Step title="In Progress" description="This is a description." />
            //     <Step title="Waiting" description="This is a description." />
            // </Steps>
            // <Divider />
            // <Steps progressDot current={1} direction="vertical">
            //     <Step title="Finished" description="This is a description. This is a description." />
            //     <Step title="Finished" description="This is a description. This is a description." />
            //     <Step title="In Progress" description="This is a description. This is a description." />
            //     <Step title="Waiting" description="This is a description." />
            //     <Step title="Waiting" description="This is a description." />
            // </Steps>
            <Card style={{ width: 150 }}>
                <Steps progressDot current={currentClass} direction="vertical">
                {todayEvents.map((event, index) => (
                    <Step key={event.turn} title={event.subject} description={event.time} />
                ))}
                </Steps>
            </Card>
    );
};

export default Schedule;
