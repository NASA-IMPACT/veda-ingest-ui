import { expect, test } from '@/__tests__/playwright/setup-msw';
import { HttpResponse } from 'msw';
import path from 'path';

test.describe('Thumbnail Uploader Page', () => {
  test('Upload unique image with proper dimensions', async ({
    page,
  }, testInfo) => {
    await page.route(
      'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
      async (route) => {
        console.log(`Image request intercepted: ${route.request().url()}`);

        // Respond with a small 1x1 transparent PNG
        const imageBuffer = Buffer.from(
          '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',
          'base64'
        );

        await route.fulfill({
          status: 200,
          contentType: 'image/jpg',
          body: imageBuffer,
        });
      }
    );

    //
    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

    // watch for img src request
    const responsePromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes('s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg') &&
        res.status() === 200
    );
    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page.getByRole('button', { name: /cloud-upload/i }).click(),
      ]);
      await fileChooser.setFiles(
        path.join(__dirname, '../../__mocks__/thumnail.jpg')
      );
    });

    await expect(
      page.getByText(/authenticating upload/i),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Image Validation' }),
      'image validation appears'
    ).toBeVisible();

    await test.step('validated image width is shown', async () => {
      const widthStatistic = page.locator('.ant-statistic').getByText('Width');
      await expect(widthStatistic).toBeVisible();
      await expect(widthStatistic.locator('..')).toContainText('2,000px');
    });

    await test.step('validated image height is shown', async () => {
      const heightStatistic = page
        .locator('.ant-statistic')
        .getByText('Height');
      await expect(heightStatistic).toBeVisible();
      await expect(heightStatistic.locator('..')).toContainText('1,000px');
    });

    await test.step('validated image aspect ratio is shown', async () => {
      const aspectRatioStatistic = page
        .locator('.ant-statistic')
        .getByText('Aspect Ratio');
      await expect(aspectRatioStatistic).toBeVisible();
      await expect(aspectRatioStatistic.locator('..')).toContainText('2.00');
    });
    await test.step('validated image file size is shown', async () => {
      const sizeStatistic = page.locator('.ant-statistic').getByText('Size');
      await expect(sizeStatistic).toBeVisible();
      await expect(sizeStatistic.locator('..')).toContainText('412KB');
    });
    await expect(
      page.getByText('S3 URI: s3://s3bucket/thumbnail.jpg'),
      'S3 URI is shown'
    ).toBeVisible();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeVisible();

    await responsePromise;

    const thumbnailUploadScreenshot = await page.screenshot({ fullPage: true });
    testInfo.attach('Succesfull Image upload', {
      body: thumbnailUploadScreenshot,
      contentType: 'image/png',
    });
  });

  test('Upload duplicate image with proper dimensions', async ({
    page,
    http,
    worker,
  }, testInfo) => {
    await worker.use(
      http.post('/api/upload-url', async ({ request }) => {
        return HttpResponse.json({
          uploadUrl:
            'https://s3bucket.s3.us-west-2.amazonaws.com/thumnbnail.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4NPAGWTH4OAKYR4F%2F20250306%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250306T210052Z&X-Amz-Expires=900&X-Amz-Signature=50d8e81e05d3b7ec427b0d9add69c839f5379ce2a27f7f7b6832c1b15fd430c8&X-Amz-SignedHeaders=host',
          fileUrl: 'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
          fileExists: true,
        });
      })
    );

    await page.route(
      'https://s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg',
      async (route) => {
        console.log(`Image request intercepted: ${route.request().url()}`);

        // Respond with a small 1x1 transparent PNG
        const imageBuffer = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAB3HSURBVHic7d17kJ11meDx53f6khsQrkICCnhXFAIzIAQUcBhU6JBOMBl3y/Gya41WuYrulOuMiAZHx53Z2qqtmpFya50dL7szJYGkQwKMLoOK3F3l4mWcFQowGAIdbjHk1t3n3T9IYwi59OW873vO+X0+VZRFp/t9nyqpfr7v75zupOhwA2sHjm2O9L05peI1KeKEFHFCEfGyiDhi1z99KeKgIqKv5lEB6AApYqSI2BLP/++mFPFkRDyRIh4uIh4uUvGrnlT89LrF122oe9bpSHUPMBnLrl7Ws71n7LSi0Tw/peL8okhnRMThdc8FQJaejIi7o0jfa/aMfW/Ojhn3rFy+cqzuoSaq7QPgXdcuPa6n0bw0ivT2lIpzi4i5dc8EAHvxTBHxg0aRbi76Rq5dt2jdb+oeaH/aMgCWXb1s1tbe0YGUivdFxDsjorfumQBgEppFKu6IIn1z9kjfP6xcvnJL3QPtqa0C4OKhxQtTs/HhSMXSiDio7nkAoAW2pIhro9n46tpLV91Z9zDj2iIAFq1ack6Rik9HxEDdswBAWYpU3JYi/mrd4Jq1dc9SawBcPLT4ghTxF1GkM+ucAwAqdk9RpC9fv2T1NZGiqGOAWgJg0bVLT4tG86oi4i113B8A2sTtzYiP3rBk6N6qb1xpAFxw9bK5M/t3fiGK9NGI6Kny3gDQppop4mvbRvr+003LVz5b1U0rC4CBocWLokhXRcRxVd0TADpGKjZGxKfXLV7zrSpeFig9AC64etncmb2jX4tUvLvsewFAxyvSdSOjvR/8zvKVT5V5m1IDYNG1S08vGs1vR8SJZd4HALrMr4tU/JvrB9fcXtYNynkdvog0sGDwskjFP0bEkaXcAwC619wU6f2vfc/re/7tG95zy/e///2WvyTQ8hOARWsXzW6O9vxDiljc6msDQG5SxKqZI33vXbl85bYWX7d1Ll538WEx2rs2FensVl4XAHKWIu6K3rGBtYvWbmrhNVvjHdcundeXin+KVJzcqmsCAM8rIn7Rm4p3rhlcs74V12tJACy65tLXFz1j34mIV7TiegDAXj2Sxnreufbd1/5yuheadgBcvGrJG1Iqbglv9gOAKgynsZ63TTcCphUAA2sHjo3R3tsi4vjpXAcAmJRHU+/Y2WsXrf31VC/QmOoXDq4ePDRG+m4Iyx8AqnZcMdJ7wzuuXnb4VC8wpQBYdvWyWSOpWOcNfwBQk1Sc1N83csOF37lwzlS+fPIBUETa2jfyj37UDwDqVUS8ZcbW2d+MYvIv6U/6NwEOnLLkUynFxyb7dQBAKd7wml++/plfffuXd07miyZVDAOrB8+IiB9GRP9kvg4AKE+KGCmKdO66pavvmMTXTMzF6y4+LEb6fpIiTpjSdABAmX49MtJ36kT/FsGJvQegiJRG+r5h+QNA23pFX+/o1yb6yRMKgEVDg++NiEVTHgkAKF8qlgwMLf6jCX3qgT7hXTe865DeHTN+WUTMm/5kAECpUrFx+87+19+0fOWz+/u0A54A9OyY8SXLHwA6RJGOmdE7+vkDfdp+TwAWXbv0tKLRvDum8OOCAEBtRpsRp9+wZOjefX3Cvk8AikjRaF4Vlj8AdJrelIq/3d8n7DMABtYsHigi3tL6mQCAsqUinX3RqiXv3Nef7+cEIP1ZKRMBAJVopOJz+/yzvX3w4qHFF0TEwtImAgCqcNbA6sHz9vYHew2AVKTLSx0HAKjKXnf6S34K4OKhxQtTkW4rfx4AoArNVJx5w+Cau3b/2EtOAFKRPlLdSABA2RrNxof3/NiLTgAu/M6Fc/q3zt4YEQdVNhUAULYts0b65q1cvnLL+AdedALQv23WpWH5A0C3OWh7/85Ldv/Ai18CKNIfVzoOAFCVF+34F14CGFg7cGyM9j4SfvMfAHSjZvSOvmLdonW/idj9BGC0991h+QNAt2rESN/g7/5lXJHeXss4AEAlUipe2PWNiIhlVy/riVS8rb6RAICyFRHnrVixohGxKwC294ydFhGH1joVAFC2w3/85vsXROwKgGbPmON/AMjBrp0/fgxwXq3DAACVKIp0fsSuACiKdHq94wAAFTkjIiK969qlx/U0muvrngYAqMZIszG/0dtovrnuQQCA6vQ3mm9uNCNeXfcgAEB1mhGvaqSIE+oeBACoTkrFiY2IOL7uQQCA6qRIJzQi4ui6BwEAqlMU8bJGpOLIugcBACpUpCMbUaTD6p4DAKhOSsXhjYiYXfcgAEClZjcior/uKQCA6hSpmCEAACA3RepvRESqew4AoFKNRt0TAADVEwAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZEgAAkCEBAAAZ6q17AAAmbkbPjHjtoa+JYw86NubNOSZm986KWb2zY6S5M7aNbovhbZtiw5bH4lfP/iqe2v503ePSxgQAQJs7uP/gOHveWXH2vIXxusNeF72Nngl93YbnNsQdj90Vt/zm1li/ZX3JU9Jp0sDqwaLuIQB4qaNmHRlLXrU4zj/uvJjRM2Na17pv0/2x6oGh+OmTP2vRdHQ6JwAAbaa/py8GX7U4lr5yMPp7+ltyzVOOPDlOOfLkuPvxH8Xf/fzrMbxtuCXXpXMJAIA2Mn/OvPjT0z4RJx5yYinXP+Po0+PNR7wpvvrT/xE/3HBrKfegM/gpAIA2ccpRJ8d/Oec/l7b8x83qnRWfPPXj8b7XvzdSpFLvRftyAgDQBhbOOzM+seDj0duo7tvy4Ksuibkz5sbf3n9VFIW3g+XGCQBAzRbOOzM+eepllS7/cecfd278yUkfqvy+1E8AANTo7HkL45OnXhY9aWI/2leGdxz/h3HRCe+s7f7UQwAA1OTseQvjE6d+rNblP+79b/jj0t97QHsRAAA1WDjvzLZZ/hERfY2++A+nfCQayVrIhf+nASrWDsf+e3PiISfGBS//g7rHoCICAKBC7fbkv6dlr7m0ljcjUj0BAFCRdn3y390RMw+Ps+ctrHsMKiAAACrQ7k/+uzv/uHPrHoEKCACAknXCk//u3nTESXHojEPrHoOSCQCAEnXSk/+4RmrEGw9/Q91jUDIBAFCSTnvy391Jh7+x7hEomQAAKEEnPvnv7riDjq17BErmZz0AWqydfsPfVB0z55i6R6BkTgAAWqjTn/zHzembXfcIlMwJAECLdMOT/7iZPTPrHoGSOQEAaIFuefIfN9IcqXsESuYEAGCauunJf9y20W11j0DJnAAATEO3PfmPG962qe4RKJkTAIAp6sYn/3Ebnnus7hEomRMAgCno1if/cf/69P+rewRK5gQAYJK6+cl/3M+f/EXdI1AyJwAAk9DtT/4RERue2xDrt6yvewxK5gQAYIJyePKPiLhlw611j0AFnAAATEAOT/4RETvHRuKmX/9z3WNQAScAAAeQy5N/RMRN6/85ntr+dN1jUAEnAAD7kcuTf0TElpEtcfWvrql7DCriBABgH3J68o+I+Oa//O/YvHNz3WNQEScAAHuR05N/RMQdG++Mm9Z77T8nTgAA9nDO/IVx2YJ8lv/Dmx+Jr9z31brHoGJOAAB2k9vyf2LbE/HFH/1lbB3dWvcoVEwAAOyycN6ZWS3/Tds3xefv/IJ3/WdKAADE88v/k6deltXyv+KOFfH41ifqHoWaCAAge5Y/ORIAQNYsf3IlAIBsWf7kTAAAWbL8yZ0AALJj+YMAADJj+cPzBACQDcsffkcAAFmw/OHFBADQ9Sx/eCkBAHQ1yx/2TgAAXcvyh30TAEBXsvxh/wQA0HUsfzgwAQB0FcsfJkYAAF3D8oeJEwBAV7D8YXIEANDxLH+YPAEAdDTLH6ZGAAAdy/KHqRMAQEey/GF6BADQcSx/mD4BAHQUyx9aQwAAHcPyh9YRAEBHsPyhtQQA0PYsf2g9AQC0NcsfyiEAgLZl+UN5BADQlix/KJcAANqO5Q/lEwBAW7H8oRq9dQ9AvubOOCTmzZ4Xs/tmxcyembFzbCS2j22PJ7YOx6btm6JZNOsekYqdM39hXLbgY9ks/+Ftw/HZO1bE8LbhukchQwKAyhw289A465gz45QjT47XHfbaOKT/kH1+7khzJB545sH4+ZO/iDs23hUPbX6owkmpg+UP1UoDqweLuoegu73piJPikhMXxWkvWxCNNLVXnR7d8mise+iG+P5vfhA7x0ZaPCF1s/yhegKA0hx/8PHxoZM+GCcd8caWXfOpHU/FN37xv+LWDbdFEf7T7QaWP9RDANByjdSI5a9+d1z6miWlfVO/b9P98Tf3fSWe2v50KdenGpY/1MdPAdBSB/cfHFee+blY/tp3l/pN/ZQjT47/es5fx0mHt+50gWpZ/lAvAUDLHDHziPjSWV+obCnPnTE3rjjj8njL0WdUcj9ax/KH+gkAWmLujEPiyjOviOMOOrbS+/b39MWnfu8/xrnHvrXS+zJ1C+edmdXy37R9U3zuzistf9qOHwNk2vp7+uOzp38m5s+ZX8v9G6kRHzvlozFWjMWtG26vZQYmxpM/tA8nAEzbv3vj++NVc19Z6wyN1IhPLPi4k4A25skf2osTAKbl948+LS58xR/WPUZEOAloZ578of04AWDK+hp98YE3vL/uMV7ESUD78eQP7ckJAFN24fEXxPw58+oe4yWcBLQPT/7QvpwAMCU9qScuOXFR3WPsk5OA+nnyh/YmAJiSU1+2II6adWTdY+zX+EmACKiev9IX2p+XAJiSt84/u+4RJsTLAdVz7A+dwQkAk5ZSigVHnlL3GBPm5YDqOPaHzuEEgEl7xUGviIP7D657jElxElA+T/7QWZwAMGknHnJC3SNMiZOA8njyh87jBIBJmzfnmLpHmDInAa3nyR86kxMAJu3QGYfWPcK0OAloHU/+0LkEAJM2q3dm3SNMmx8RnD4/6gedTQCQLREwdZY/dD4BwKRtG91e9wgtIwImz/KH7uBNgEza0zuernuElvLGwInzhj/oHk4AmLSNzz1e9wgt542BB+YNf9BdnAAwaQ9tfqjuEUrhJGDfPPlD93ECwKT9+rfr47c7f1v3GKVwEvBSnvyhOwkAJq2IIn4yfG/dY5Rm/CTgnPkL6x6ldufMX5jVG/6Gtw3H5bd/3hv+yIIAYEpu3XBb3SOUykmAJ3/odgKAKbln+N7YuLX73gy4u5x/RNCP+kH3EwBMSbNoxrqHrq97jNLl+HKAY3/IgwBgyr7765tiw3OP1T1G6XJ6OcCxP+RDADBlo83R+J+/+HrdY1Qih5MAT/6QFwHAtPzkiXvinx75bt1jVKKbTwI8+UN+BADT9vV/+UY88OyDdY9RiW48CfDkD3kSAEzbzrGR+OLdX44Nz22oe5RKdNNJgCd/yJcAoCU279wcV971xWy+sXbDSYAnf8ibAKBlhrdtyuobbCefBOT45H/FHZ78YXcCgJbK7ReqdOIvC8rxl/x89vYV8cS2PP6bhIkSALScCGhflj8wTgBQChHQfix/YHcCgNKIgPZh+QN7EgCUSgTUz/IH9kYAUDoRUB/LH9gXAUAlRED1LH9gfwQAlREB1bH8gQMRAFRKBJTP8gcmQgBQORFQHssfmCgBQC1EQOtZ/sBkCABqIwJax/IHJksAUCsRMH2WPzAVAoDaiYCps/yBqRIAtAURMHmWPzAdAoC2IQImzvIHpksA0FZEwIFZ/kArCADajgjYN8sfaBUBQFsSAS9l+QOtJABoWyLgdyx/oNUEAG1NBFj+QDl6Xvue16+oewjYn62jW+OujXfHGcecHgf1zal7nNKllOKMo0+Px7c+HsceNN/yB0qRBlYPFnUPARNx1Kwj44tnXRlHzTqq7lEq0SyaEfH8qUAOhrcNx2fv+HwMb9tU9yiQhTy+s9AVhrdtistv/3xWLwfksvyff6nnSssfKpTHdxe6Rm7vCciBY3+ohwCg44iA7mH5Q30EAB1JBHQ+yx/qJQDoWCKgc1n+UD8BQEcTAZ3H8of2IADoeCKgc1j+0D4EAF1BBLQ/yx/aiwCga4iA9mX5Q/sRAHQVEdB+LH9oTwKAriMC2oflD+1LANCVRED9LH9obwKAriUC6mP5Q/sTAHQ1EVA9yx86gwCg64mA6lj+0DkEAFkQAeWz/KGzCACyIQLKY/lD5xEAZEUEtJ7lD51JAJAdEdA6lj90LgFAlkTA9Fn+0NkEANkSAVNn+UPnEwBkTQRMnuUP3UEAkD0RMHGWP3QPAQAhAibC8ofuIgBgFxGwb5Y/dB8BALsRAS9l+UN3EgCwBxHwO5Y/dC8BAHshAix/6HYCAPYh5wiw/KH7CQDYjxwjwPKHPAgAOICcIsDyh3wIAJiAHCLA8oe8CACYoG6OAMsf8iMAYBK6MQIsf8iTAIBJ6qYIsPwhXwIApqAbIsDyh7wJAJiiTo4Ayx8QADANnRgBlj8QIQBg2jopAix/YJwAgBbohAiw/IHdCQBokXaOAMsf2JMAgBZqxwiw/IG9EQDQYu0UAZY/sC8CAErQDhFg+QP7IwCgJJu2b4rP3bkiHntuY+X3fuy5jXH57Z+z/IF9EgBQouFtm+Izd1wRDzzzYGX3/NUzD8Rn7vhsDG/bVNk9gc4jAKBkz+54Ni6/43Nx/UM3RhFFqff6wW9uiSvuXBHP7thc6n2AzpcGVg+W+x0JeMGpRy2If3/SB2P+nHktve5vtmyIv/vF38e9w/e19LpA9xIAULHeRm9c8PK3x+JXXhJHz37ZtK61cevjMfTgdXHzozfHaHOsRRMCORAAUJNGasSCo06Jt84/OxYcuSDmzjhkQl/37I7Ncc+me+LWDbfFvcP3R7Noljwp0I0EALSBFCmOO+i4OHHu8TFv9rw4bOZhMat3ZkREbBvdHk/veDo2bHksHt78SDy65dHS30sAdL/eugcAIoooYv2W9bF+y/q6RwEy4acAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDAgAAMiQAACBDjYgo6h4CAKhUsxERO+ueAgCoUCp2CgAAyEwq0o5GRGytexAAoFJbGxHxVN1TAADVKSKebETEproHAQAqtakREU/UPQUAUJ2UYriRIh6uexAAoDpFEQ81CgEAAFkpIh5uNIv0QN2DAADV6SnSA43enrH76x4EAKhQz9j9KSJiYPXgExFxVM3jAADlG163ZOhl438Z0P+tdRQAoBIpFXdH/O5vA/x+faMAAFVpFul7EbsCoNlo3lzvOABAFXp27fxGRMScHTPuiYina50IACjbU6fdc9p9EbsCYOXylWNFxC31zgQAlOx7K1asaEb87j0A0SiSlwEAoIulVLyw618IgNQzdk1EjNUyEQBQttGxnf2rxv/lhQC4bvF1G4oIpwAA0J3+zw3LV24c/5fG7n/SiPhW9fMAAGVLe+z4FwXAjtlbV0XEbyudCAAo2+boHVuz+wdeFADffcd3n0sRqwIA6CbXrF20duvuH2i85FOaja9WNg4AUIX/vucHXhIAay9ddWd4MyAAdIvvrlsydPeeH3zpCUBEpCJ9qfx5AICyNRvNve70tK8vuHho8a2pSGeXNxIAULLb1y0Z2usu3+sJQEREjPV8ubRxAIDSpYgr9/Nn+1BEGhgavC0izipjKACgPKlIt6xduvrcff35vk8AUhTNVHw4IkbLGAwAKM1oEfHx/X3CvgMgIm4YXPPTSMVVrZ0JAChTUaT/tm7p6vv29zn7DYCIiLH+nVdExIaWTQUAlCZFPNacuf0vDvR5BwyAGy+6cXNKxadaMxYAUKZmkS678aIbNx/o8/b9JsA9DKweXB0Rg9OaCgAoT5GuWbd09bKJfOoBTwDG9UZ8MCIemvJQAEBpUsSD20d7PzTRz59wAAwtGXomNRt/FBE7pzQZAFCKFDESzcZ7b1q+8tmJfs2EAyAiYu2lq34URfrzyY8GAJSlGfGnu/4unwmb8HsAXlBEWjQ0eE0RsXTSXwsAtFRKsXLt4NDyyX7dpE4Anr9TFDNH+t4bET+c9NcCAK2TijujZ+wDU/rSqd7zgquXzZ3ZN/KDiDhlqtcAAKbsZ0XfyNuuH7j+6al88eRPAHa5afnKZxuN5kVFxMNTvQYAMCWP9qTioqku/4hpBEBExHWLr9vQGOt5V0QMT+c6AMCEDTcazQvWDK5ZP52LTCsAIiLWvvvaX45FnJUiHpzutQCA/Xqk0Wi+9brF1/3rdC807QCIiLhxydCDO5uNt0bEfv/iAQBgior087Fm45xWLP+IFgVARMR3Ll31WG/EeeGnAwCgtVJxZ1/EuTdeuurRVl2yZQEQ8fxvC5w10veOFLGqldcFgFylFCu3PH3Y+auXrn6ypddt5cV2d/HqwT9JEX8TEf1l3QMAulWKGGmm4orrF6/560hRlHD98ly8evD3GhHfLiJeVeZ9AKDLPJKajfdM9tf7TkZLXwLY0/VLhn7cE/H7UaTVZd4HALpGka7ZPtJ3SpnLP6LkE4DdDQwtXhRF+kpEvLyqewJAp0gRjxWp+LN1g2u+WdH9qnPhdy6c07919qci4s/DewMAICJiNFJx1Vj/zituvOjGzVXdtNIAGHfJmktOHivSValIZ9dxfwBoB6lItzQjPnr90tU/q/zeVd9wd4tWLTmnSMWKiPiDOucAgCoVqbgtRfzVusVr1pXxDv+JqDUAxu0KgU9HxEDdswBAWV5Y/INr1tY9S1sEwLiLhha/JRXpIyni0og4uO55AKAFNkeRro1UfHXdkqG76x5mXFsFwLjz/v4DM+fMfXZRSsX7IuKdEdFb90wAMAnNiLg5UvGtWTv7V61cvnJL3QPtqS0DYHfvuHbpvL5ULE2peHvx/N81cHjdMwHAXjwZEd9Pqbh5bGf/qhuWr9xY90D70/YBsLsVK1Y0fvzm+xc0G83zU8TbI+L0iDiq7rkAyNJwSsXdzSJ9r6fRvPm0e067b8WKFc26h5qojgqAvbno6mXH9PSNnBypeHURcUKKdEI009FFxBHRaB4RRZoRqZgVRZpZ96wAdIBUbI8ibYtU7Ihm48kU8WQ0iseLKB4uivRQT5EeGB3t/Wm7P+EfyP8H6TQXJCa5m/cAAAAASUVORK5CYII=',
          'base64'
        );

        await route.fulfill({
          status: 200,
          contentType: 'image/jpg',
          body: imageBuffer,
        });
      }
    );

    await test.step('Navigate to the Thumbnail Upload Page', async () => {
      await page.goto('/upload');
    });

    // watch for img src request
    const responsePromise = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes('s3bucket.s3.us-west-2.amazonaws.com/thumbnail.jpg') &&
        res.status() === 200
    );
    await test.step('click to upload a file', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        await page.getByRole('button', { name: /cloud-upload/i }).click(),
      ]);
      await fileChooser.setFiles(
        path.join(__dirname, '../../__mocks__/thumnail.jpg')
      );
    });

    await expect(
      page.getByText(/authenticating upload/i),
      'authenticating upload message appears'
    ).toBeVisible();

    await test.step('confirm overwrite', async () => {
      await expect(
        page.locator('.ant-modal-content').getByText('File Already Exists')
      ).toBeVisible();

      const overwriteConfirmModalScreenshot = await page.screenshot({
        fullPage: true,
      });
      testInfo.attach('Confirm Overwrite Modal', {
        body: overwriteConfirmModalScreenshot,
        contentType: 'image/png',
      });

      await page.getByRole('button', { name: 'Overwrite' }).click();
    });

    await expect(
      page.getByRole('heading', { name: 'Image Validation' }),
      'image validation appears'
    ).toBeVisible();

    await test.step('validated image width is shown', async () => {
      const widthStatistic = page.locator('.ant-statistic').getByText('Width');
      await expect(widthStatistic).toBeVisible();
      await expect(widthStatistic.locator('..')).toContainText('2,000px');
    });

    await test.step('validated image height is shown', async () => {
      const heightStatistic = page
        .locator('.ant-statistic')
        .getByText('Height');
      await expect(heightStatistic).toBeVisible();
      await expect(heightStatistic.locator('..')).toContainText('1,000px');
    });

    await test.step('validated image aspect ratio is shown', async () => {
      const aspectRatioStatistic = page
        .locator('.ant-statistic')
        .getByText('Aspect Ratio');
      await expect(aspectRatioStatistic).toBeVisible();
      await expect(aspectRatioStatistic.locator('..')).toContainText('2.00');
    });
    await test.step('validated image file size is shown', async () => {
      const sizeStatistic = page.locator('.ant-statistic').getByText('Size');
      await expect(sizeStatistic).toBeVisible();
      await expect(sizeStatistic.locator('..')).toContainText('412KB');
    });
    await expect(
      page.getByText('S3 URI: s3://s3bucket/thumbnail.jpg'),
      'S3 URI is shown'
    ).toBeVisible();

    await expect(
      page.getByText('Thumbnail uploaded successfully!'),
      'authenticating upload message appears'
    ).toBeVisible();

    await expect(
      page.getByAltText(/uploaded thumbnail/i),
      'Uploaded Thumbnail heading'
    ).toBeVisible();

    await responsePromise;
  });
});
