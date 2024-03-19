import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { CommunicationChannel } from '@app/model/convs-mgr/conversations/admin/system';
import { PlatformType } from '@app/model/convs-mgr/conversations/admin/system';

@Component({
  selector: 'italanta-apps-connect-to-channel-modal',
  templateUrl: './connect-to-channel-modal.component.html',
  styleUrls: ['./connect-to-channel-modal.component.scss'],
})

export class ConnectToChannelModalComponent {
  @Output() selectedPlatformOutput = new EventEmitter<{ selectedPlatform: PlatformType; }>();

  channels: CommunicationChannel[];
  selectedPlatform: PlatformType;
  channelForm: FormGroup;
  selectedChannelId: string;
  whatsappValue: PlatformType = PlatformType.WhatsApp;
  messengerValue: PlatformType = PlatformType.Messenger;

  constructor(
    private fb: FormBuilder,
    private _dialog: MatDialog
  ) { }

  onPlatformSelected()
  {
    this.selectedPlatformOutput.emit({ selectedPlatform: this.selectedPlatform });
  }

  closeDialog()
  {
    this._dialog.closeAll();
  }
}
