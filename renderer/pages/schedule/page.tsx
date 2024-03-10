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
setSchedule(data)
        })
    }, []);
    const today = new Date().toLocaleDateString();

    const todayEvents = scheduleData.map(event => ({ ...event, date: today }));

    return (
            <Card style={{ width: 130 }}>
                <Steps progressDot current={currentClass} direction="vertical">
                {todayEvents.map((event, index) => {
                    if (event.show){return (<Step key={event.turn} title={event.subject} description={event.time} />)}
                }
                )}
                </Steps>
            </Card>
    );
};

export default Schedule;
