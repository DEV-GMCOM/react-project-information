import React, { useState } from 'react';
import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { ko } from 'date-fns/locale';

const FixedExpenseCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    return (
        <Box sx={{ padding: 3 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="overline" color="text.secondary">
                        운영관리 (Dev) &gt; 고정지출비용
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        고정지출비용
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        월별 고정 지출 내역을 캘린더에서 확인하고 관리하세요.
                    </Typography>
                </Box>

                <Paper elevation={1} sx={{ padding: 3 }}>
                    <Stack spacing={2}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            일정 보기
                        </Typography>
                        <Divider />
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                            <DateCalendar
                                value={selectedDate}
                                onChange={setSelectedDate}
                                sx={{
                                    '& .MuiPickersDay-root': { fontWeight: 600 },
                                    '& .MuiDayCalendar-weekDayLabel': { fontWeight: 700 }
                                }}
                            />
                        </LocalizationProvider>
                        <Typography variant="body2" color="text.secondary">
                            선택한 날짜: {selectedDate ? selectedDate.toLocaleDateString() : '없음'}
                        </Typography>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

export default FixedExpenseCalendar;
