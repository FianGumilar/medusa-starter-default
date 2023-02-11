import { Inject, Injectable } from '@nestjs/common';
import { Customer, Order, } from '@medusajs/medusa';
import { RequestContext } from '@medusajs/medusa/dist/types/request';
import { XENDIT_PLUGIN_OPTIONS } from './constant';
import { XenditCreateInvoiceResponse, XenditPluginOptions } from './xendit.types.interface';
import { HttpService } from '@nestjs/axios';
import { map, tap } from 'rxjs';

@Injectable()
export class XenditService {
    constructor(
        @Inject(XENDIT_PLUGIN_OPTIONS) private options: XenditPluginOptions, private httpService: HttpService,
    ) {}

    private async getCustomer(activeOrder: Order): Promise<Customer> {
        if(activeOrder?.customer?.email) {
            return activeOrder.customer;
        }
        
        /* ENSURE CUSTOMER ORDER ARE AVAILABALE
        // const order = await this. 
        */
    } 

    async createPayment(context: RequestContext, order: Order): Promise<XenditCreateInvoiceResponse> {
        try {
            const customer = await this.getCustomer(order);
            const payload = {
                amount: order.tax_total,
                currency: 'IDR',
                payer_email: customer.email,
                invoice_duration: this.options.invoiceDuration,
                payment_methods: this.options.paymentMethods
            }

            console.log('Xendit API Key : ', this.options.apiKey);
            console.log('Xendit Payload', payload)

            const payment = this.httpService.post('https://api.xendit.co/v2/invoices', payload, {
                auth: {
                    username: this.options.apiKey,
                    password: ''
                }
            }).pipe(
                tap((response) => console.log(response)),
                map((response) => response.data),
                tap((data) => {
                    console.log(data);
                    return data;
                }),
            );
            console.log('payment: ', payment);
            return payment as any;
        } catch(err: any) {
            console.log('Create Xendit Payment Error: ', err as any);
        }
        throw new Error('Error creat Xendit Payment')
    }

    async verifyCallback(callbackToken?: string) {
        return (
            this.options?.callbackToken?.length && this.options?.callbackToken !== callbackToken
        )
    }
}
