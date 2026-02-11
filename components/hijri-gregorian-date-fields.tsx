'use client';

import { UseFormReturn } from 'react-hook-form';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import arabic from 'react-date-object/calendars/arabic';
import arabic_ar from 'react-date-object/locales/arabic_ar';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { format } from 'date-fns';
import { createHijriDateObject, dateObjectToTimestamp } from '@/lib/hijri-utils';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface HijriGregorianDateFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  hijriFieldName?: string;
  hijriYearFieldName?: string;
  gregorianFieldName?: string;
}

export function HijriGregorianDateFields({
  form,
  hijriFieldName = 'event_date_hijri',
  hijriYearFieldName = 'event_date_hijri_year',
  gregorianFieldName = 'event_date_gregorian',
}: HijriGregorianDateFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Hijri Date Picker */}
      <FormField
        control={form.control}
        name={hijriFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hijri Date</FormLabel>
            <FormControl>
              <DatePicker
                calendar={arabic}
                locale={arabic_ar}
                value={createHijriDateObject(field.value)}
                onChange={(date: DateObject | null) => {
                  if (date) {
                    field.onChange(dateObjectToTimestamp(date));
                    form.setValue(hijriYearFieldName, date.year);

                    const gregorianDate = new DateObject(date).convert(
                      gregorian,
                      gregorian_en
                    );
                    form.setValue(
                      gregorianFieldName,
                      gregorianDate.format('YYYY-MM-DD')
                    );
                  } else {
                    field.onChange('');
                    form.setValue(hijriYearFieldName, undefined);
                    form.setValue(gregorianFieldName, '');
                  }
                }}
                format="D MMMM YYYY"
                placeholder="Select Hijri date"
                containerClassName="w-full"
                inputClass="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Gregorian Date */}
      <FormField
        control={form.control}
        name={gregorianFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gregorian Date</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={field.value || ''}
                onChange={(e) => {
                  const selectedDate = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  if (selectedDate) {
                    field.onChange(format(selectedDate, 'yyyy-MM-dd'));

                    const hijriDate = new DateObject(selectedDate).convert(
                      arabic,
                      arabic_ar
                    );
                    form.setValue(
                      hijriFieldName,
                      dateObjectToTimestamp(hijriDate)
                    );
                    form.setValue(hijriYearFieldName, hijriDate.year);
                  } else {
                    field.onChange('');
                    form.setValue(hijriFieldName, '');
                    form.setValue(hijriYearFieldName, undefined);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
