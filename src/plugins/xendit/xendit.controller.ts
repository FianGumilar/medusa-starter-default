import { Controller, Headers, HttpStatus, Post, Req, Res, Logger } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { Order, OrderService, Payment} from '@medusajs/medusa';
import { RequestContext } from '@medusajs/medusa/dist/types/request';
import { Response } from 'express';
import { loggerCtx } from './constant';
import { ReqWithRawBody, XenditCallbackRequest } from './xendit.types.interface';
import { XenditService } from './xendit.service';
import PaymentMethodV2 = require('xendit-node/src/payment_method_v2/payment_method_v2');


@Controller('payment')
export class XenditController {
    constructor(
        private orderService: OrderService,
        private xenditService: XenditService
    ) {}

    @Post('xendit')
    async webhook(
        @Headers('x-callback-token') callbackToken: string,
        @Req() request: ReqWithRawBody,
        @Res() response: Response
    ): Promise<void> {
        if(!callbackToken) {
            Logger.error('Xendit-signature header not availabe', Logger)
            response.status(HttpStatus.BAD_REQUEST).send('Xendit-sgnature header not availabe');
            return;
        }

        try {
            await this.xenditService.verifyCallback(callbackToken);
        } catch(error: any) {
            Logger.error(`Error verifying Xendit signature ${callbackToken}: ${error.message}`, loggerCtx);
            response.status(HttpStatus.BAD_REQUEST).send('Error verifying Xendit signature');
            return;
        }
        console.log('x-callback-token: ', callbackToken);

		const xenditPayment = request.body as XenditCallbackRequest;
        if(!xenditPayment) {
            Logger.error('No payment intent', loggerCtx);
            response.status(HttpStatus.BAD_REQUEST).send('No payment intent');
            return
        }

        console.log('XenditPayent: ', xenditPayment);

        const channelToken = xenditPayment.description.split('_')[0];
        const orderCode = xenditPayment.external_id;
        // const ctx

        const order = await this.orderService
        if(!order) {
            throw Error(
                `Cannot find order ${orderCode}, Unable to settle payment ${xenditPayment.id}!`,
            );
        }
    }

    private async getPaymentMethod(context: RequestContext): Promise<Payment> {
        const method = (await this.xenditService.getRepository(context, Payment));
        if(!method) {
            throw new InternalServerErrorException(
                `${loggerCtx} Cannot find Xendit Payment method`,
            )
        }
        return method;
    }
}
