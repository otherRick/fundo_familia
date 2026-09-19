"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fundConfig } from "@/config/fund";

export function InvestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Investir
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fazer uma contribuição</DialogTitle>
          <DialogDescription>
            Você pode realizar uma nova contribuição através de transferência
            bancária.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5 rounded-lg border p-4 text-sm">
            <p className="font-medium">PIX</p>
            <p className="text-muted-foreground">Pix indisponível no momento</p>
          </div>

          <div className="space-y-1.5 rounded-lg border p-4 text-sm">
            <p className="font-medium">Conta Investimento</p>
            <p>{fundConfig.bankTransfer.accountName}</p>
            <p>Agência: {fundConfig.bankTransfer.agency}</p>
            <p>Conta: {fundConfig.bankTransfer.account}</p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

